import json
from typing import Literal

from requests import Session
from urllib.parse import urljoin

from settings import get_settings

settings = get_settings()


def persist_to_file(base_file_name):
    def decorator(original_func):
        def wrapper(self, *args, **kwargs):
            if not settings.debug_use_cache:
                return original_func(self, *args, **kwargs)

            args_s = ",".join(map(str, args))
            kwargs_s = ",".join(f"{k}={v}" for k, v in kwargs.items())
            filename = "_".join(filter(bool, [base_file_name, args_s, kwargs_s]))
            cache_filename = f"cache/{filename}.json"

            try:
                res = json.load(open(cache_filename, "r"))
            except (IOError, ValueError):
                res = list(original_func(self, *args, **kwargs))
                with open(cache_filename, "w") as io:
                    json.dump(res, io)

            return res

        return wrapper

    return decorator


class FabmanSession(Session):
    """
    Adds Fabman base URL and token authentication to each request.
    """

    def __init__(self):
        super().__init__()
        self.base_url = settings.fabman_api_url
        self.headers.update({"Authorization": f"Bearer {settings.fabman_api_key}"})

    def request(self, method, url, *args, **kwargs):
        joined_url = urljoin(self.base_url, url)
        return super().request(method, joined_url, *args, **kwargs)

    def get_all_json(self, url, params, batch_size=200):
        offset = 0
        while True:
            response = self.get(
                url,
                params={
                    **params,
                    "limit": batch_size,
                    "offset": offset,
                },
            ).json()

            yield from response

            if len(response) < batch_size:
                break

            offset += batch_size

    @persist_to_file("list_members")
    def list_members(self, include: Literal["memberPackages", "trainings"] = None):
        return self.get_all_json(
            "members",
            params={"embed": include},
        )

    @persist_to_file("list_resources")
    def list_resources(self):
        yield from self.get_all_json(
            "resources",
            params={
                "state": ["active", "locked"],
                "space": 3,
            },
        )

    @persist_to_file("list_resource_logs")
    def list_resource_logs(self, date_start, date_end):
        yield from self.get_all_json(
            "resource-logs",
            params={
                "from": date_start,
                "until": date_end,
                "status": "complete",
                "type": "allowed",
                "space": 3,
            },
        )

    @persist_to_file("list_training_courses")
    def list_training_courses(self):
        yield from self.get_all_json(
            "training-courses",
            params={"archived": False},
        )
