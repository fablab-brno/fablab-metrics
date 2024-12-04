import os.path
import pathlib
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

root_dir = pathlib.Path(__file__).parent.parent.resolve()


class Settings(BaseSettings):
    fabman_api_url: str = Field(default="https://fabman.io/api/v1/")
    fabman_api_key: str

    data_path: str = Field(default=os.path.join(root_dir, "data"))

    db_path: str = Field(default=os.path.join(root_dir, "cache", "metrics.db"))

    debug_use_cache: bool = Field(default=False)

    model_config = SettingsConfigDict(
        env_file=".env.local", env_file_encoding="utf-8", env_nested_delimiter="__"
    )


@lru_cache
def get_settings():
    return Settings()
