"""
Perceived machine availability: what a member finds when they come to the lab.

For every visit (first entrance check-in of a member per day) we take the
machine categories the member is trained on (except BOZP) and the state of
each category at check-in time:

- "ok": at least `threshold` machines of the category work,
- "limited": some machines work, but fewer than `threshold`,
- "unavailable": no machine of the category works.

The visit gets the worst state of its categories.

The threshold is derived from demand: the 90th percentile of how many machines
of the category were running at check-in times during the 180 days before the
month. It is at least 1 and at most the number of machines in the category.

A machine counts from its first record in Fabman (first use or first outage),
so machines bought later do not inflate availability of earlier months.
"""

import json
import math
import os
from bisect import bisect_right
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from os import path

from db import get_db
from resources.maintenance import _iso, _load_outages, _load_resources, _now, _tracking_since
from settings import get_settings

settings = get_settings()

DEMAND_PERCENTILE = 0.9
DEMAND_WINDOW = timedelta(days=180)
EXCLUDED_TRAINING_CATEGORIES = {"", "BOZP"}

STATES = ("ok", "limited", "unavailable")


def _parse(value):
    """Fabman ISO timestamp or DB datetime string -> naive UTC datetime."""
    if not value:
        return None
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
    return parsed


def _count_active(starts, ends, at):
    """Number of intervals running at `at`, given sorted starts and ends."""
    return bisect_right(starts, at) - bisect_right(ends, at)


def _percentile(values, q):
    if not values:
        return 0
    ordered = sorted(values)
    return ordered[max(0, math.ceil(q * len(ordered)) - 1)]


class Category:
    def __init__(self, name):
        self.name = name
        self.first_seen = []
        self.usage_starts = []
        self.usage_ends = []
        self.outage_starts = []
        self.outage_ends = []

    def finalize(self):
        for attr in vars(self).values():
            if isinstance(attr, list):
                attr.sort()

    def machines(self, at):
        return bisect_right(self.first_seen, at)

    def working(self, at):
        down = _count_active(self.outage_starts, self.outage_ends, at)
        return max(0, self.machines(at) - down)

    def running(self, at):
        return _count_active(self.usage_starts, self.usage_ends, at)


class Model:
    def __init__(self, categories, visits, now):
        self.categories = categories
        # Sorted (time, member_id, trained categories) of visits.
        self.visits = visits
        self.visit_times = [v[0] for v in visits]
        self.now = now
        # Machines of each category running at each visit, aligned with visit_times.
        self.running = {
            name: [c.running(t) for t in self.visit_times] for name, c in categories.items()
        }
        self._thresholds = {}

    def thresholds(self, month_start):
        """Per-category demand threshold valid for the month starting at `month_start`."""
        if month_start not in self._thresholds:
            lo = bisect_right(self.visit_times, month_start - DEMAND_WINDOW)
            hi = bisect_right(self.visit_times, month_start)
            self._thresholds[month_start] = {
                name: max(1, _percentile(running[lo:hi], DEMAND_PERCENTILE))
                for name, running in self.running.items()
            }
        return self._thresholds[month_start]

    def state(self, category, at):
        """State of a category at `at` and the numbers behind it, or None if it has no machines yet."""
        c = self.categories[category]
        machines = c.machines(at)
        if machines == 0:
            return None

        month_start = at.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        threshold = min(self.thresholds(month_start)[category], machines)
        working = c.working(at)

        if working == 0:
            state = "unavailable"
        elif working < threshold:
            state = "limited"
        else:
            state = "ok"

        return {"state": state, "machines": machines, "working": working, "threshold": threshold}

    def visits_between(self, date_start, date_end):
        lo = bisect_right(self.visit_times, date_start - timedelta(microseconds=1))
        hi = bisect_right(self.visit_times, date_end)
        return self.visits[lo:hi]


def _load_categories(now):
    with get_db() as db:
        machines = {
            row["id"]: row["category"]
            for row in db.execute(
                """
                SELECT id, category FROM resources
                WHERE type = 'machine' AND COALESCE(category, '') != ''
                """
            ).fetchall()
        }
        usage = db.execute(
            "SELECT resource_id, date_start, date_end FROM resource_log WHERE date_start IS NOT NULL"
        ).fetchall()

    categories = {name: Category(name) for name in set(machines.values())}
    first_seen = {}

    for row in usage:
        category = machines.get(row["resource_id"])
        if category is None:
            continue
        start = _parse(row["date_start"])
        end = _parse(row["date_end"]) or start
        c = categories[category]
        c.usage_starts.append(start)
        c.usage_ends.append(end)
        first_seen[row["resource_id"]] = min(start, first_seen.get(row["resource_id"], start))

    outages = [
        # Ongoing outages last past "now", so the current snapshot counts them.
        (o["resource_id"], o["date_start"], o["date_end"] or datetime.max)
        for o in _load_outages(now)
    ]
    # Machines locked now without a disable log (start unknown) are down only
    # from now on, so they affect the current snapshot but not history.
    ongoing = {resource_id for resource_id, _, end in outages if end == datetime.max}
    outages += [
        (r["id"], now, datetime.max)
        for r in _load_resources().values()
        if r["state"] == "locked" and r["id"] not in ongoing
    ]

    for resource_id, start, end in outages:
        category = machines.get(resource_id)
        if category is None:
            continue
        c = categories[category]
        c.outage_starts.append(start)
        c.outage_ends.append(end)
        first_seen[resource_id] = min(start, first_seen.get(resource_id, start))

    for resource_id, seen in first_seen.items():
        categories[machines[resource_id]].first_seen.append(seen)

    for c in categories.values():
        c.finalize()

    return categories


def _load_visits(categories):
    """First entrance check-in per member and day, with categories the member was trained on by then."""
    with get_db() as db:
        checkins = db.execute(
            """
            SELECT rl.member_id, rl.date_start
            FROM resource_log AS rl
            JOIN resources AS r ON r.id = rl.resource_id
            WHERE r.type = 'entrance' AND rl.member_id IS NOT NULL AND rl.date_start IS NOT NULL
            """
        ).fetchall()
        trainings = db.execute(
            """
            SELECT t.member_id, t.date, tc.category
            FROM trainings AS t
            JOIN training_courses AS tc ON tc.id = t.training_id
            WHERE COALESCE(tc.level, '') != 'bozp'
            """
        ).fetchall()

    trained = {}
    for row in trainings:
        category = row["category"] or ""
        if category in EXCLUDED_TRAINING_CATEGORIES or category not in categories:
            continue
        trained.setdefault(row["member_id"], []).append((_parse(row["date"]), category))

    first_per_day = {}
    for row in checkins:
        at = _parse(row["date_start"])
        key = (row["member_id"], at.date())
        if key not in first_per_day or at < first_per_day[key]:
            first_per_day[key] = at

    visits = []
    for (member_id, _), at in first_per_day.items():
        member_categories = sorted(
            {category for date, category in trained.get(member_id, []) if date is None or date <= at}
        )
        if member_categories:
            visits.append((at, member_id, member_categories))

    return sorted(visits)


@lru_cache
def _model():
    now = _now()
    categories = _load_categories(now)
    return Model(categories, _load_visits(categories), now)


def _worst(states):
    return max(states, key=STATES.index)


def _windows(date_window):
    """Windows clipped to the period with outage tracking, as in machine downtime."""
    tracking_since = _tracking_since()
    if tracking_since is None:
        return

    now = _now()
    for date_start, date_end in date_window():
        window_start = max(date_start, tracking_since)
        window_end = min(date_end, now)
        if window_end > window_start:
            yield date_start, window_start, window_end


def calculate_perceived_availability(date_window):
    """Share of visits in each state."""
    model = _model()

    for date, window_start, window_end in _windows(date_window):
        counts = dict.fromkeys(STATES, 0)

        for at, _, member_categories in model.visits_between(window_start, window_end):
            states = [s["state"] for s in (model.state(c, at) for c in member_categories) if s]
            if states:
                counts[_worst(states)] += 1

        visits = sum(counts.values())
        if visits == 0:
            continue

        yield {
            "date": date,
            "visits": visits,
            **counts,
            **{f"{state}_pct": round(100 * counts[state] / visits, 1) for state in STATES},
        }


def calculate_perceived_availability_by_category(date_window):
    """Per category: % of visits of trained members that found it limited or unavailable."""
    model = _model()

    for date, window_start, window_end in _windows(date_window):
        totals = {}
        affected = {}

        for at, _, member_categories in model.visits_between(window_start, window_end):
            for category in member_categories:
                s = model.state(category, at)
                if s is None:
                    continue
                totals[category] = totals.get(category, 0) + 1
                if s["state"] != "ok":
                    affected[category] = affected.get(category, 0) + 1

        yield {
            "date": date,
            **{
                category: round(100 * affected.get(category, 0) / total, 1)
                for category, total in totals.items()
            },
        }


def write_perceived_status():
    """Current state of each category with its demand threshold."""
    model = _model()
    now = model.now

    categories = []
    for name in sorted(model.categories):
        s = model.state(name, now)
        if s is not None:
            categories.append({"category": name, **s})

    filename = path.join(settings.data_path, "perceived_status.json")
    os.makedirs(path.dirname(filename), exist_ok=True)

    with open(filename, "w", encoding="utf-8") as jsonfile:
        json.dump(
            {
                "date": _iso(now),
                "demand_percentile": DEMAND_PERCENTILE,
                "demand_window_days": DEMAND_WINDOW.days,
                "categories": categories,
            },
            jsonfile,
            ensure_ascii=False,
        )
