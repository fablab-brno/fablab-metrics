import json
import logging
import os
from datetime import datetime, timezone
from os import path

from dateutil.relativedelta import relativedelta

from dates import monthly, yearly
from members.extract import (
    extract_member_trainings,
    extract_training_courses,
    extract_member_packages,
)
from members.transform import (
    calculate_trainings_by_date,
    calculate_active_members_by_package,
    calculate_total_members_by_package,
    calculate_package_changes_by_month,
    calculate_trainings_by_member,
)
from members.write import write_training_courses
from resources.extract import extract_resources, extract_resource_logs
from resources.transform import calculate_resource_usage, calculate_member_visits
from resources.write import write_resources
from settings import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()


def group_by_date(data):
    groups = {}
    for row in data:
        date = row.pop("date")
        row["date"] = date.strftime("%Y-%m-%d")
        groups.setdefault(date, [])
        groups[date].append(row)
    return groups


def write_dataset(name, granularity_label, dataset):
    for date, data in group_by_date(dataset).items():
        format = "%Y" if granularity_label == "1y" else "%Y-%m"
        date_label = date.strftime(format)
        filename = path.join(
            settings.data_path, name, granularity_label, f"{date_label}.json"
        )
        os.makedirs(path.dirname(filename), exist_ok=True)

        with open(filename, "w") as jsonfile:
            json.dump(list(data), jsonfile, ensure_ascii=False)


if __name__ == "__main__":
    db_empty = not os.path.exists(settings.db_path)

    if db_empty:
        print("Fetching all historical resource logs")
        date_start = datetime(year=2017, month=1, day=1)
        last_date = datetime.today().replace(day=1) + relativedelta(months=1)

        while date_start < last_date:
            date_end = date_start + relativedelta(months=1)
            extract_resource_logs(date_start=date_start, date_end=date_end)
            date_start = date_end
    else:
        # Fetch data from last month. Script is supposed to run monthly which gives
        # enough overlap.
        date_end = datetime.today().replace(day=1)
        date_start = date_end + relativedelta(months=-1)

        extract_resource_logs(date_start=date_start, date_end=date_end)

    extract_resources()
    extract_training_courses()
    member_packages_status = extract_member_packages()
    extract_member_trainings()

    write_training_courses()
    write_resources()

    with open(os.path.join(settings.data_path, "status.json"), "w") as jsonfile:
        json.dump(
            {
                "date": datetime.now(timezone.utc).isoformat(),
                **member_packages_status,
            },
            jsonfile,
            ensure_ascii=False,
        )

    datasets = {
        # Members & packages
        "active_members_by_package": calculate_active_members_by_package,
        "total_members_by_package": calculate_total_members_by_package,
        "package_changes_by_month": calculate_package_changes_by_month,
        # Resources
        "resources_usage": calculate_resource_usage,
        "member_visits": calculate_member_visits,
        # Trainings
        "trainings_by_date": calculate_trainings_by_date,
        "trainings_by_member": calculate_trainings_by_member,
    }

    granularity = {
        "1m": monthly,
        "1y": yearly,
    }

    for granularity_label, data_window in granularity.items():
        for metric, fn in datasets.items():
            print(f"Processing {metric} - {granularity_label}")
            write_dataset(metric, granularity_label, fn(data_window))
