"""
Machine maintenance metrics.

An outage is the period between a `resourceDisabled` log and the next
`resourceEnabled` log of the same machine in Fabman. Outages still in progress
(machine is locked now) are counted until "now".
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


def _load_resources():
    with get_db() as db:
        rows = db.execute(
            """
            SELECT id, name, COALESCE(category, '') AS category, state, sla_hours
            FROM resources
            WHERE type = 'machine'
            """
        ).fetchall()
    return {row["id"]: dict(row) for row in rows}


def _load_events():
    with get_db() as db:
        return db.execute(
            """
            SELECT resource_id, type, created_at, stopped_at, notes
            FROM resource_state_events
            WHERE created_at IS NOT NULL
            ORDER BY resource_id, created_at, id
            """
        ).fetchall()


def build_outages(events, resources, now):
    """
    Pairs disable/enable logs into outages.

    - A disable while an outage is already open only adds its notes.
    - An enable without an open outage is ignored.
    - The end of an outage is the next enable log. Without one, `stoppedAt` of
      the disable log is used. Without either, the outage is ongoing if the
      machine is locked now, otherwise its end is unknown and it is dropped.
    """
    outages = []
    open_by_resource = {}

    def close(resource_id, date_end):
        outage = open_by_resource.pop(resource_id)
        outage["date_end"] = date_end
        outages.append(outage)

    for event in events:
        resource_id = event["resource_id"]
        if resource_id not in resources:
            continue

        created_at = _parse(event["created_at"])
        current = open_by_resource.get(resource_id)

        if event["type"] == "resourceDisabled":
            if current is None:
                open_by_resource[resource_id] = {
                    "resource_id": resource_id,
                    "date_start": created_at,
                    "stopped_at": _parse(event["stopped_at"]),
                    "notes": [event["notes"]] if event["notes"] else [],
                }
            elif event["notes"] and event["notes"] not in current["notes"]:
                current["notes"].append(event["notes"])
        elif event["type"] == "resourceEnabled" and current is not None:
            close(resource_id, created_at)

    for resource_id, outage in list(open_by_resource.items()):
        stopped_at = outage["stopped_at"]
        if stopped_at is not None and stopped_at > outage["date_start"]:
            close(resource_id, stopped_at)
        elif resources[resource_id]["state"] == "locked":
            close(resource_id, None)
        else:
            open_by_resource.pop(resource_id)

    result = []
    for o in outages:
        resource = resources[o["resource_id"]]
        result.append(
            {
                "resource_id": o["resource_id"],
                "name": resource["name"],
                "category": resource["category"] or "Bez kategorie",
                "notes": " | ".join(o["notes"]),
                "date_start": o["date_start"],
                "date_end": o["date_end"],
                "effective_end": o["date_end"] or now,
                "sla_hours": resource["sla_hours"] or settings.machine_sla_hours,
            }
        )
    return sorted(result, key=lambda o: o["date_start"])


def _load_outages(now):
    return build_outages(_load_events(), _load_resources(), now)


def _tracking_since():
    with get_db() as db:
        value = db.execute("SELECT MIN(created_at) FROM resource_state_events").fetchone()[0]
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

    # Machines locked now whose disable log is missing (e.g. locked before
    # Fabman started writing these logs): start and duration are unknown.
    known = {o["resource_id"] for o in current}
    for resource in _load_resources().values():
        if resource["state"] == "locked" and resource["id"] not in known:
            current.append(
                {
                    "resource_id": resource["id"],
                    "name": resource["name"],
                    "category": resource["category"] or "Bez kategorie",
                    "notes": "",
                    "date_start": None,
                    "date_end": None,
                    "hours": None,
                    "sla_hours": resource["sla_hours"] or settings.machine_sla_hours,
                    "sla_breached": None,
                }
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
