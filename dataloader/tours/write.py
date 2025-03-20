import json
import os
from os import path

from db import get_db
from settings import get_settings

settings = get_settings()


def write_tours_reservations():
    with get_db() as db:
        res = db.execute("SELECT name, is_member FROM tours_reservations;")
        tours_reservations = map(dict, res.fetchall())

        filename = path.join(settings.data_path, "tours_reservations.json")
        os.makedirs(path.dirname(filename), exist_ok=True)

        with open(filename, "w") as jsonfile:
            json.dump(list(tours_reservations), jsonfile, ensure_ascii=False)
