from datetime import datetime

from dateutil.relativedelta import relativedelta

from db import get_db


CURRENT_MONTH_LAST_DAY = datetime.today().replace(day=1) + relativedelta(months=1)


def monthly():
    with get_db() as db:
        res = db.execute("SELECT MIN(date_start), MAX(date_end) FROM membership")

        date_start, last_date = map(
            lambda s: (datetime or CURRENT_MONTH_LAST_DAY).strptime(s, "%Y-%m-%d"), res.fetchone()
        )
        date_start = date_start.replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )

        if last_date > CURRENT_MONTH_LAST_DAY:
            last_date = CURRENT_MONTH_LAST_DAY

    while date_start < last_date:
        date_end = date_start + relativedelta(months=1, seconds=-1)
        yield date_start, date_end

        date_start += relativedelta(months=+1)


def yearly():
    with get_db() as db:
        res = db.execute("SELECT MIN(date_start), MAX(date_end) FROM membership")

        date_start, last_date = map(
            lambda s: (datetime or CURRENT_MONTH_LAST_DAY).strptime(s, "%Y-%m-%d"), res.fetchone()
        )
        date_start = date_start.replace(
            day=1, month=1, hour=0, minute=0, second=0, microsecond=0
        )

        if last_date > CURRENT_MONTH_LAST_DAY:
            last_date = CURRENT_MONTH_LAST_DAY

    while date_start < last_date:
        date_end = date_start + relativedelta(years=1, seconds=-1)
        yield date_start, date_end

        date_start += relativedelta(years=+1)

def tours_monthly():
    with get_db() as db:
        res = db.execute("SELECT MIN(date_start), MAX(date_end) FROM tours_reservations")

        date_start, last_date = map(
            lambda s: (datetime or CURRENT_MONTH_LAST_DAY).strptime(s, "%Y-%m-%d"), res.fetchone()
        )
        date_start = date_start.replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )

        if last_date > CURRENT_MONTH_LAST_DAY:
            last_date = CURRENT_MONTH_LAST_DAY

    while date_start < last_date:
        date_end = date_start + relativedelta(months=1, seconds=-1)
        yield date_start, date_end

        date_start += relativedelta(months=+1)


def tours_yearly():
    with get_db() as db:
        res = db.execute("SELECT MIN(date_start), MAX(date_end) FROM tours_reservations")

        date_start, last_date = map(
            lambda s: (datetime or CURRENT_MONTH_LAST_DAY).strptime(s, "%Y-%m-%d"), res.fetchone()
        )
        date_start = date_start.replace(
            day=1, month=1, hour=0, minute=0, second=0, microsecond=0
        )

    while date_start < last_date:
        date_end = date_start + relativedelta(years=1, seconds=-1)
        yield date_start, date_end

        date_start += relativedelta(years=+1)