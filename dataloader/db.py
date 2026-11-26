import os.path
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from functools import lru_cache

from settings import get_settings


@lru_cache
def get_db_connection():
    settings = get_settings()

    if not os.path.exists(os.path.dirname(settings.db_path)):
        os.makedirs(os.path.dirname(settings.db_path))

    sqlite3.register_adapter(datetime, adapt_datetime)
    db = sqlite3.connect(settings.db_path)
    db.row_factory = sqlite3.Row

    setup_sqls = [
        """
        CREATE TABLE IF NOT EXISTS membership(
            member_id integer,
            package text,
            date_start text,
            date_end text,
            package_id integer,
            gender text
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS training_courses(
            id integer,
            title integer,
            category text default '',
            level text default ''
        )
        """,
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_training_courses_id ON training_courses (id)",
        """
        CREATE TABLE IF NOT EXISTS trainings(
            member_id integer,
            training_id integer,
            training_title text,
            date text
        )
        """,
        """
        CREATE UNIQUE INDEX IF NOT EXISTS idx_trainings_member_id_training_id 
        ON trainings (member_id, training_id)
        """,
        """
        CREATE TABLE IF NOT EXISTS resource_log(
            id integer,
            resource_id integer,
            resource_name text,
            member_id integer,
            date_start text,
            date_end text
        )
        """,
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_resource_log_id ON resource_log (id)",
        """
        CREATE TABLE IF NOT EXISTS resources(
            id integer,
            name text,
            type text default '', -- "entrance", "machine"
            category text default ''
            CHECK ( type IN ('entrance', 'machine', '') )
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS packages(
            id integer,
            name text
        )
        """,
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_resources_id ON resources (id)",
        """
        CREATE TABLE IF NOT EXISTS tours_reservations(
            id integer,
            name text,
            date_start text,
            date_end text,
            customer_id integer,
            customer_email text default '',
            is_member boolean default FALSE,
            member_id integer,
            state integer,
            info_source text
        )
        """,
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_tours_reservations_id ON tours_reservations (id)",
        # Fabman keeps no history of resource states, so every dataloader run
        # stores a snapshot of the current state and opens/closes outages.
        """
        CREATE TABLE IF NOT EXISTS resource_state_log(
            resource_id integer,
            checked_at text, -- UTC, "%Y-%m-%d %H:%M:%S"
            state text,
            maintenance_notes text default ''
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS resource_outages(
            id integer PRIMARY KEY AUTOINCREMENT,
            resource_id integer,
            date_start text, -- UTC, "%Y-%m-%d %H:%M:%S"
            date_end text, -- NULL while the resource is still out of order
            notes text default ''
        )
        """,
        "CREATE INDEX IF NOT EXISTS idx_resource_outages_resource_id ON resource_outages (resource_id)",
    ]

    cursor = db.cursor()
    cursor.executescript(";".join(setup_sqls))
    migrate_resources_table(cursor)

    return db


def migrate_resources_table(cursor):
    """Adds columns introduced after the `resources` table was first created."""
    columns = {row["name"] for row in cursor.execute("PRAGMA table_info(resources)")}

    if "state" not in columns:
        cursor.execute("ALTER TABLE resources ADD COLUMN state text default ''")
    if "sla_hours" not in columns:
        cursor.execute("ALTER TABLE resources ADD COLUMN sla_hours real")


@contextmanager
def get_db():
    db = get_db_connection()
    cursor = db.cursor()
    yield cursor
    db.commit()


def adapt_datetime(date):
    return date.strftime("%Y-%m-%d")
