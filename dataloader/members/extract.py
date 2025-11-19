import logging
from collections import namedtuple

from db import get_db
from fabman import FabmanSession
from settings import get_settings
from utils.dict import dot_path

settings = get_settings()

logger = logging.getLogger(__name__)


def extract_member_packages():
    with FabmanSession() as s:
        members = s.list_members("memberPackages")

    with get_db() as db:
        members_without_package = 0
        for member in members:
            parsed_packages = []

            for package in dot_path(member, "_embedded.memberPackages"):
                package_name = dot_path(package, "_embedded.package.name")
                package_id = dot_path(package, "_embedded.package.id")

                date_start = package["fromDate"]
                date_end = package["untilDate"]

                parsed_packages.append({
                    "name": package_name,
                    "date_start": date_start,
                    "date_end": date_end,
                    "package_id": package_id
                })

            member_id = member["id"]

            db.execute("DELETE FROM membership WHERE member_id = ?", (member_id,))
            if not len(parsed_packages):
                members_without_package += 1

            for package in parsed_packages:
                db.execute(
                    "INSERT INTO membership (member_id, package, date_start, date_end, package_id) VALUES (?, ?, ?, ?, ?)",
                    (member_id, package["name"], package["date_start"], package["date_end"], package["package_id"]),
                )

        db.execute("DELETE FROM packages WHERE id > 0")

        db.execute("""
            INSERT INTO packages (id, name)
            SELECT package_id AS id, package AS name
            FROM membership
            GROUP BY package;
        """)

    return {
        "members_without_package": members_without_package,
    }


PACKAGE_ALIASES = {"Open Hours": "Učedník"}

NamedRange = namedtuple("NamedRange", ["name", "start", "end"])


def normalize_package_name(value):
    if value in PACKAGE_ALIASES:
        return PACKAGE_ALIASES[value]

    # Unify day packages into one
    if value.startswith("Tovaryš"):
        return "Tovaryš"

    return value


def extract_member_trainings():
    with FabmanSession() as s:
        members = s.list_members("trainings")

    trainings = [
        {
            "member_id": member["id"],
            "training_id": dot_path(training, "_embedded.trainingCourse.id"),
            "training_title": dot_path(training, "_embedded.trainingCourse.title"),
            "date": training["createdAt"],
        }
        for member in members
        for training in dot_path(member, "_embedded.trainings")
    ]

    with get_db() as db:
        db.executemany(
            """
            REPLACE INTO trainings (member_id, training_id, training_title, date)
            VALUES (:member_id, :training_id, :training_title, :date)
            """,
            trainings,
        )


def extract_training_courses():
    with FabmanSession() as s:
        training_courses = s.list_training_courses()

    training_courses = [
        {
            "id": training["id"],
            "title": training["title"],
            "category": dot_path(training, "metadata.METRICS_CATEGORY"),
            "level": dot_path(training, "metadata.METRICS_TRAINING_LEVEL"),
        }
        for training in training_courses
    ]

    with get_db() as db:
        db.executemany(
            """
            INSERT INTO training_courses (id, title, category, level) VALUES (:id, :title, :category, :level)
            ON CONFLICT (id) DO UPDATE SET title=excluded.title, category=excluded.category, level=excluded.level
            """,
            training_courses,
        )
