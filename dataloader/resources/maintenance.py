"""
Machine maintenance metrics derived from `resource_outages`.

An outage is a period when a machine had state "locked" in Fabman. Outages
still in progress are counted until "now".
"""

import json
import os
from datetime import datetime, timezone
from os import path

from db import get_db
from settings import get_settings

settings = get_settings()

DB_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def _parse(value):
    return datetime.strptime(value, DB_DATE_FORMAT) if value else None


def _now():
    return datetime.now(timezone.utc).replace(tzinfo=None, microsecond=0)


def _hours(delta):
    return delta.total_seconds() / 3600


def _load_outages(now):
    with get_db() as db:
        rows = db.execute(
            """
            SELECT
                o.id, o.resource_id, o.date_start, o.date_end, o.notes,
                r.name, COALESCE(r.category, '') AS category, r.sla_hours
            FROM resource_outages AS o
            JOIN resources AS r ON r.id = o.resource_id
            WHERE r.type = 'machine'
            ORDER BY o.date_start
            """
        ).fetchall()

    outages = []
    for row in rows:
        date_end = _parse(row["date_end"])
        outages.append(
            {
                "id": row["id"],
                "resource_id": row["resource_id"],
                "name": row["name"],
                "category": row["category"] or "Bez kategorie",
                "notes": row["notes"] or "",
                "date_start": _parse(row["date_start"]),
                "date_end": date_end,
                "effective_end": date_end or now,
                "sla_hours": row["sla_hours"] or settings.machine_sla_hours,
            }
        )
    return outages


def _tracking_since():
    with get_db() as db:
        value = db.execute("SELECT MIN(checked_at) FROM resource_state_log").fetchone()[0]
    return _parse(value)


def _machine_count():
    with get_db() as db:
        return db.execute(
            "SELECT COUNT(*) FROM resources WHERE type = 'machine' AND state IN ('active', 'locked')"
        ).fetchone()[0]


def calculate_machine_downtime(date_window):
    """
    Monthly/yearly summary of machine downtime.

    Only the part of each window after tracking started (and before now) is
    measured, so months before tracking existed are skipped instead of being
    reported as 100 % available.
    """
    tracking_since = _tracking_since()
    if tracking_since is None:
        return

    now = _now()
    outages = _load_outages(now)
    machines = _machine_count()

    for date_start, date_end in date_window():
        window_start = max(date_start, tracking_since)
        window_end = min(date_end, now)

        if window_end <= window_start:
            continue

        observed_hours = _hours(window_end - window_start)

        downtime_hours = 0.0
        for o in outages:
            overlap = min(o["effective_end"], window_end) - max(o["date_start"], window_start)
            if overlap.total_seconds() > 0:
                downtime_hours += _hours(overlap)

        started = [o for o in outages if date_start <= o["date_start"] <= date_end]
        resolved = [
            o for o in outages if o["date_end"] is not None and date_start <= o["date_end"] <= date_end
        ]
        durations = [_hours(o["date_end"] - o["date_start"]) for o in resolved]
        within_sla = [
            o for o, hours in zip(resolved, durations) if hours <= o["sla_hours"]
        ]

        yield {
            "date": date_start,
            "machines": machines,
            "observed_hours": round(observed_hours, 1),
            "downtime_hours": round(downtime_hours, 1),
            # Time-weighted average number of machines out of order.
            "avg_machines_down": round(downtime_hours / observed_hours, 2),
            "availability_pct": (
                round(100 * (1 - downtime_hours / (machines * observed_hours)), 2)
                if machines
                else None
            ),
            "outages_started": len(started),
            "outages_resolved": len(resolved),
            "avg_repair_hours": (
                round(sum(durations) / len(durations), 1) if durations else None
            ),
            "max_repair_hours": round(max(durations), 1) if durations else None,
            "sla_met_pct": (
                round(100 * len(within_sla) / len(resolved), 1) if resolved else None
            ),
        }


def calculate_machine_downtime_by_category(date_window):
    """Hours out of order per machine category."""
    tracking_since = _tracking_since()
    if tracking_since is None:
        return

    now = _now()
    outages = _load_outages(now)

    for date_start, date_end in date_window():
        window_start = max(date_start, tracking_since)
        window_end = min(date_end, now)

        if window_end <= window_start:
            continue

        by_category = {}
        for o in outages:
            overlap = min(o["effective_end"], window_end) - max(o["date_start"], window_start)
            if overlap.total_seconds() > 0:
                by_category[o["category"]] = by_category.get(o["category"], 0) + _hours(overlap)

        yield {
            "date": date_start,
            **{category: round(hours, 1) for category, hours in by_category.items()},
        }


def _iso(value):
    return value.replace(tzinfo=timezone.utc).isoformat() if value else None


def write_machine_status(recent_limit=30):
    """Current snapshot: machines out of order right now and recent outages."""
    now = _now()
    outages = _load_outages(now)
    tracking_since = _tracking_since()

    def serialize(o):
        hours = _hours(o["effective_end"] - o["date_start"])
        return {
            "resource_id": o["resource_id"],
            "name": o["name"],
            "category": o["category"],
            "notes": o["notes"],
            "date_start": _iso(o["date_start"]),
            "date_end": _iso(o["date_end"]),
            "hours": round(hours, 1),
            "sla_hours": o["sla_hours"],
            "sla_breached": hours > o["sla_hours"],
        }

    current = sorted(
        (serialize(o) for o in outages if o["date_end"] is None),
        key=lambda o: o["hours"],
        reverse=True,
    )
    recent = [
        serialize(o)
        for o in sorted(
            (o for o in outages if o["date_end"] is not None),
            key=lambda o: o["date_end"],
            reverse=True,
        )[:recent_limit]
    ]

    filename = path.join(settings.data_path, "machine_status.json")
    os.makedirs(path.dirname(filename), exist_ok=True)

    with open(filename, "w", encoding="utf-8") as jsonfile:
        json.dump(
            {
                "date": _iso(now),
                "tracking_since": _iso(tracking_since),
                "default_sla_hours": settings.machine_sla_hours,
                "machines": _machine_count(),
                "current": current,
                "recent": recent,
            },
            jsonfile,
            ensure_ascii=False,
        )
