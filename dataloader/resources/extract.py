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
            "maintenance_notes": resource.get("maintenanceNotes") or "",
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

    record_resource_states(resources)


def record_resource_states(resources, checked_at=None):
    """
    Stores a snapshot of resource states and updates outages.

    A machine is out of order while its Fabman state is "locked". An outage
    starts at the first snapshot that sees the resource locked and ends at the
    first snapshot that sees it active again, so its precision equals how often
    the dataloader runs.
    """
    checked_at = (checked_at or datetime.now(timezone.utc)).strftime("%Y-%m-%d %H:%M:%S")

    with get_db() as db:
        open_outages = {
            row["resource_id"]: row["id"]
            for row in db.execute(
                "SELECT id, resource_id FROM resource_outages WHERE date_end IS NULL"
            ).fetchall()
        }

        for resource in resources:
            db.execute(
                """
                INSERT INTO resource_state_log (resource_id, checked_at, state, maintenance_notes)
                VALUES (?, ?, ?, ?)
                """,
                (resource["id"], checked_at, resource["state"], resource["maintenance_notes"]),
            )

            outage_id = open_outages.pop(resource["id"], None)

            if resource["state"] == "locked":
                if outage_id is None:
                    db.execute(
                        "INSERT INTO resource_outages (resource_id, date_start, notes) VALUES (?, ?, ?)",
                        (resource["id"], checked_at, resource["maintenance_notes"]),
                    )
                elif resource["maintenance_notes"]:
                    db.execute(
                        "UPDATE resource_outages SET notes = ? WHERE id = ?",
                        (resource["maintenance_notes"], outage_id),
                    )
            elif outage_id is not None:
                db.execute(
                    "UPDATE resource_outages SET date_end = ? WHERE id = ?",
                    (checked_at, outage_id),
                )

        # Resources that disappeared from the listing (archived/deleted) are
        # no longer out of order from the point of view of the metrics.
        for outage_id in open_outages.values():
            db.execute(
                "UPDATE resource_outages SET date_end = ? WHERE id = ?",
                (checked_at, outage_id),
            )


def parse_float(value):
    try:
        return float(value) if value not in (None, "") else None
    except (TypeError, ValueError):
        return None
