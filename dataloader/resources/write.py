import json
import os
from os import path

from db import get_db
from settings import get_settings

settings = get_settings()


def write_resources():
    with get_db() as db:
        res = db.execute("SELECT category FROM resources WHERE type == 'machine';")
        resources = map(dict, res.fetchall())

        filename = path.join(settings.data_path, "resources.json")
        os.makedirs(path.dirname(filename), exist_ok=True)

        with open(filename, "w") as jsonfile:
            json.dump(list(resources), jsonfile, ensure_ascii=False)
