import json
import re
import os
from pathlib import Path

from requests import Session
from urllib.parse import urljoin, urlparse

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
            filename = re.sub(r'[:,\s]', '-', filename)
            cache_filename = f"cache/{filename}.json"

            try:
                res = json.load(open(cache_filename, "r"))
            except (IOError, ValueError):
                res = list(original_func(self, *args, **kwargs))
                with open(Path(Path(os.getcwd()).parent, cache_filename), "w") as io:
                    json.dump(res, io)

            return res

        return wrapper

    return decorator


class ReenioSession(Session):
    """
    Adds Reenio base URL and token authentication to each request.
    """

    def __init__(self, lang: str):
        super().__init__()
        self.base_url = f"{settings.reenio_api_url}/{lang}/{settings.reenio_api_subpath}"
        self.headers.update({"Authorization": f"Bearer {settings.reenio_api_key}"})

    def request(self, method, url, *args, **kwargs):
        joined_url = urljoin(self.base_url, url)
        return super().request(method, joined_url, *args, **kwargs)

    def get_all_json(self, url, params, batch_size=10):
        continuation_token = ""
        while True:
            response = self.get(
                url,
                params={
                    **params,
                    "limit": batch_size,
                    "continuationToken": continuation_token,
                },
            ).json()

            yield from response["list"]

            if not response["hasNextPage"]:
                break

            parsed_next_page_query = urlparse(response["nextPage"]).query
            continuation_token = parsed_next_page_query.split("=")[-1]

    @persist_to_file("list_reservations_customers_emails")
    def list_reservations_customers_emails(self):
        return self.get_all_json(
            "customers",
            params=None,
        )

    @persist_to_file("list_tours_reservations_logs")
    def list_tours_reservations_logs(self, date_start, date_end):
        tours = {
            "FabLab Tour JIC": 38280,
            "Fablab Tour EN": 43587,
            "Fablab Tour KUMST": 50516
        }

        for service_id in tours.values():
            yield from self.get_all_json(
                "reservation",
                params={
                    "start": date_start,
                    "end": date_end,
                    "serviceId": service_id
                },
            )
