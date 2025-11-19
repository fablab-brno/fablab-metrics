import json
import os
from os import path

from db import get_db
from settings import get_settings

settings = get_settings()


def write_training_courses():
    with get_db() as db:
        res = db.execute("SELECT * FROM training_courses WHERE category != '';")
        training_courses = map(dict, res.fetchall())

        filename = path.join(settings.data_path, "training_courses.json")
        os.makedirs(path.dirname(filename), exist_ok=True)

        with open(filename, "w") as jsonfile:
            json.dump(list(training_courses), jsonfile, ensure_ascii=False)


def write_packages():
    with get_db() as db:
        res = db.execute("SELECT * FROM packages;")
        packages = map(dict, res.fetchall())

        filename = path.join(settings.data_path, "packages.json")
        os.makedirs(path.dirname(filename), exist_ok=True)

        with open(filename, "w") as jsonfile:
            json.dump(list(packages), jsonfile, ensure_ascii=True)
