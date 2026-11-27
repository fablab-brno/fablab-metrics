from datetime import datetime, timezone

from db import get_db
from fabman import FabmanSession
from settings import get_settings
from utils.dict import dot_path

settings = get_settings()


def extract_resource_logs(date_start, date_end):
    with FabmanSession() as s:
        logs = s.list_resource_logs(date_start, date_end)

    with get_db() as db:
        db.executemany(
            """
            REPLACE INTO resource_log (id, resource_id, member_id, date_start, date_end) 
            VALUES (:id, :resource, :member, :createdAt, :stoppedAt)
            """,
            logs,
        )


def extract_resources():
    with FabmanSession() as s:
        all_resources = s.list_resources()

    resources = [
        {
            "id": resource["id"],
            "name": resource["name"],
            "category": dot_path(resource, "metadata.METRICS_CATEGORY"),
            "type": dot_path(resource, "metadata.METRICS_EQUIPMENT_TYPE"),
            "state": resource.get("state") or "",
            "sla_hours": parse_float(dot_path(resource, "metadata.METRICS_SLA_HOURS")),
        }
        for resource in all_resources
    ]

    with get_db() as db:
        db.executemany(
            """
            INSERT INTO resources (id, name, category, type, state, sla_hours)
            VALUES (:id, :name, :category, :type, :state, :sla_hours)
            ON CONFLICT (id) DO UPDATE SET
                name=excluded.name, category=excluded.category, type=excluded.type,
                state=excluded.state, sla_hours=excluded.sla_hours
            """,
            resources,
        )


def extract_resource_training_courses():
    """Stores which training courses unlock each machine."""
    with get_db() as db:
        machine_ids = [
            row["id"]
            for row in db.execute(
                "SELECT id FROM resources WHERE type = 'machine' AND state IN ('active', 'locked')"
            ).fetchall()
        ]

    with FabmanSession() as s:
        links = [
            {"resource_id": resource_id, "training_course_id": course["id"]}
            for resource_id in machine_ids
            for course in s.list_resource_training_courses(resource_id)
        ]

    with get_db() as db:
        db.execute("DELETE FROM resource_training_courses")
        db.executemany(
            """
            INSERT INTO resource_training_courses (resource_id, training_course_id)
            VALUES (:resource_id, :training_course_id)
            """,
            links,
        )


def extract_resource_state_events(date_start, date_end):
    """Stores resourceDisabled / resourceEnabled logs used for machine outages."""
    with FabmanSession() as s:
        logs = s.list_resource_state_logs(date_start, date_end)

    events = [
        {
            "id": log["id"],
            "resource_id": log["resource"],
            "type": log["type"],
            "created_at": to_db_datetime(log.get("createdAt")),
            "stopped_at": to_db_datetime(log.get("stoppedAt")),
            "notes": log.get("notes") or "",
        }
        for log in logs
        if log.get("type") in ("resourceDisabled", "resourceEnabled")
    ]

    with get_db() as db:
        db.executemany(
            """
            REPLACE INTO resource_state_events (id, resource_id, type, created_at, stopped_at, notes)
            VALUES (:id, :resource_id, :type, :created_at, :stopped_at, :notes)
            """,
            events,
        )


def to_db_datetime(value):
    """Fabman ISO timestamp (e.g. "2024-03-01T10:00:00.000Z") -> naive UTC string."""
    if not value:
        return None
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
    return parsed.strftime("%Y-%m-%d %H:%M:%S")


def parse_float(value):
    try:
        return float(value) if value not in (None, "") else None
    except (TypeError, ValueError):
        return None
