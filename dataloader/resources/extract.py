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
        }
        for resource in all_resources
    ]

    with get_db() as db:
        db.executemany(
            """
            INSERT INTO resources (id, name, category, type) VALUES (:id, :name, :category, :type)
            ON CONFLICT (id) DO UPDATE SET name=excluded.name, category=excluded.category, type=excluded.type
            """,
            resources,
        )
