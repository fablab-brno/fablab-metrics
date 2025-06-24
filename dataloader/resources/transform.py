from datetime import datetime
from dateutil.relativedelta import relativedelta

from db import get_db


def calculate_resource_usage(date_window):
    last_date = datetime.today().replace(day=1) + relativedelta(months=1)

    for date_start, date_end in date_window():
        if date_end > last_date:
            break

        with get_db() as db:
            res = db.execute(
                """
                SELECT 
                    r.category,
                    ROUND(SUM((
                        JULIANDAY(CASE WHEN rl.date_end > :date_end THEN :date_end ELSE rl.date_end END)
                        - JULIANDAY(CASE WHEN rl.date_start < :date_start THEN :date_start ELSE rl.date_start END))
                    ) * 24) AS usage_secs
                FROM 
                    resource_log as rl
                    LEFT JOIN resources as r ON r.id = rl.resource_id
                WHERE 
                    rl.date_start <= :date_end AND rl.date_end >= :date_start
                    AND r.type = 'machine'
                GROUP BY r.category
                ORDER BY usage_secs DESC
            """,
                {"date_start": date_start, "date_end": date_end},
            )

            yield {
                "date": date_start,
                **{row["category"]: row["usage_secs"] for row in res.fetchall()},
            }


def calculate_member_visits(date_window):
    for date_start, date_end in date_window():
        with get_db() as db:
            res = db.execute(
                """
                SELECT
                    COUNT(DISTINCT member_id) AS count,
                    CASE WHEN num_visits < 3 THEN '<3' WHEN num_visits > 7 THEN '>7' ELSE '3-7' END AS label
                FROM (
                    SELECT 
                        rl.member_id,
                        COUNT(DISTINCT date(date_start)) AS num_visits
                    FROM 
                        resource_log as rl
                        LEFT JOIN resources as r ON r.id = rl.resource_id
                    WHERE 
                        date(rl.date_start) >= :date_start AND date(rl.date_start) <= :date_end
                        AND r.type = 'entrance'
                    GROUP BY rl.member_id
                )
                GROUP BY label
                ORDER BY count DESC
            """,
                {"date_start": date_start, "date_end": date_end},
            )

            yield {
                "date": date_start,
                **{row["label"]: row["count"] for row in res.fetchall()},
            }
