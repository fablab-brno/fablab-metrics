import json
import os
from os import path

from db import get_db
from settings import get_settings

settings = get_settings()


def write_tours_sources():
    with get_db() as db:
        res = db.execute("SELECT info_source FROM tours_reservations GROUP BY info_source;")
        sources = map(dict, res.fetchall())

        filename = path.join(settings.data_path, "tours_info_source.json")
        os.makedirs(path.dirname(filename), exist_ok=True)

        with open(filename, "w", encoding="utf-8") as jsonfile:
            json.dump([s["info_source"] for s in sources], jsonfile, ensure_ascii=False)
