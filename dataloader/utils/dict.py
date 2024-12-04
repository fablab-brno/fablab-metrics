from functools import reduce
from typing import List


def dot_path(obj: dict, path: str):
    try:
        return reduce(
            lambda acc, key: acc.get(key) if acc is not None else None,
            path.split("."),
            obj,
        )
    except TypeError:
        print(obj, path)
        raise


def pick(obj: dict, keys: List[str]):
    return {key: value for key, value in obj.items() if key in keys}
