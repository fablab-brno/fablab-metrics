from db import get_db
from members.constants import (
    package_level_sql,
    package_labels,
)


def calculate_trainings_by_date(date_window):
    for date_start, date_end in date_window():
        output = {"date": date_start}

        with get_db() as db:
            res = db.execute(
                """
            SELECT COUNT(distinct  t.member_id) AS count, tc.category
            FROM trainings t LEFT JOIN training_courses AS tc on tc.id = t.training_id
            WHERE category != '' AND date(date) BETWEEN ? AND ?
            GROUP BY tc.category
            ORDER BY count DESC;
            """,
                (date_start, date_end),
            )

            for row in res.fetchall():
                output[row["category"]] = row["count"]

        yield output


def calculate_trainings_by_member(date_window):
    bozp = [65, 2382]
    basic = [20, 2384, 2383, 15, 22, 103]
    advanced = [654, 151, 118, 1625, 2021, 2371, 2618]

    with get_db() as db:
        for date_start, date_end in date_window():
            one_res = db.execute(
                f"""
                SELECT COUNT(DISTINCT t.member_id)
                FROM trainings AS t
                LEFT JOIN training_courses AS tc ON tc.id = t.training_id
                WHERE tc.category IS NOT NULL AND tc.category != '' AND t.training_id NOT IN ({','.join('?' * len(bozp))}) AND t.date <= ?
                """,
                [*bozp, date_end],
            )
            one_count = (one_res.fetchone() or [0])[0]

            basic_res = db.execute(
                f"""
                SELECT COUNT(*) FROM (
                    SELECT member_id, COUNT(DISTINCT t.training_id) as count
                    FROM trainings AS t
                    WHERE t.training_id IN ({','.join('?' * len(bozp + basic))}) AND t.date <= ?
                    GROUP BY member_id
                    HAVING count >= 3
                );
                """,
                [*(bozp + basic), date_end],
            )
            basic_count = (basic_res.fetchone() or [0])[0]

            advanced_res = db.execute(
                f"""
                SELECT COUNT(*) FROM (
                    SELECT member_id, COUNT(DISTINCT t.training_id) as count
                    FROM trainings AS t
                    WHERE t.training_id IN ({','.join('?' * len(bozp + advanced))}) AND t.date <= ?
                    GROUP BY member_id
                    HAVING count >= 3
                );
                """,
                [*(bozp + advanced), date_end],
            )
            advanced_count = (advanced_res.fetchone() or [0])[0]

            yield {
                "date": date_start,
                "one": one_count,
                "basic": basic_count,
                "advanced": advanced_count,
            }


def calculate_active_members_by_package(date_window):
    with get_db() as db:
        for date_start, date_end in date_window():
            # SQL for filtering intervals that overlaps with selected date range
            date_range_sql = """
                (
                    -- interval starts within the date range
                    (date(date_start) >= :date_start AND date(date_start) <= :date_end)
                    -- interval ends within the date range
                    OR (date(date_end) >= :date_start AND date(date_end) <= :date_end)
                    -- interval starts before and ends within the date range
                    OR (date(date_start) <= :date_start AND date(date_end) >= :date_start)
                    -- interval starts before the date range and never ends
                    OR (date(date_start) <= :date_start AND date_end IS NULL)
                )
            """

            # The subquery ensures that each member is accounted only once
            # and only for the highest available package.
            # e.g if a member has overlapping packages Mistr and Open Hours,
            # it'll be accounted only for Mistr
            sql = f"""
            SELECT 
                package,
                COUNT(DISTINCT membership.member_id) 
            FROM membership 
            INNER JOIN (
                SELECT
                    MAX({package_level_sql}) as package_level,
                    member_id 
                FROM membership
                WHERE {date_range_sql}
                GROUP BY member_id
                HAVING package_level != -1
            ) AS highest_package ON
                membership.member_id = highest_package.member_id
                AND {package_level_sql} = highest_package.package_level
            WHERE {date_range_sql}
            GROUP BY package
            """

            res = db.execute(sql, {"date_start": date_start, "date_end": date_end})
            yield {
                "date": date_start,
                **{package: count for package, count in res.fetchall()},
            }


def calculate_total_members_by_package(date_window):
    with get_db() as db:
        for date_start, date_end in date_window():
            res = db.execute(
                f"""
                    SELECT 
                        {package_level_sql},
                        COUNT(DISTINCT membership.member_id)
                    FROM membership 
                    INNER JOIN (
                        SELECT
                            MAX({package_level_sql}) as package_level,
                            member_id 
                        FROM membership
                        WHERE :date >= date(date_start)
                        GROUP BY member_id
                    ) AS highest_package ON
                        membership.member_id = highest_package.member_id
                        AND {package_level_sql} = highest_package.package_level
                    WHERE 
                        :date >= date(date_start)
                    GROUP BY package_level
                """,
                {"date": date_end},
            )
            yield {
                "date": date_start,
                **{
                    package_labels[package_level]: count
                    for package_level, count in res.fetchall()
                },
            }


def calculate_package_changes_by_month(date_window):
    with get_db() as db:
        for date_start, date_end in date_window():
            res = db.execute(
                """
                SELECT member_id, package
                FROM membership 
                WHERE 
                    package IN ('Učedník', 'Tovaryš', 'Mistr') AND
                    (
                        ? BETWEEN date(date_start) AND date(date_end) 
                        OR ? BETWEEN date(date_start) AND date(date_end)
                    )
                ORDER BY member_id, date_start
                """,
                (
                    date_start,
                    date_end,
                ),
            )
            packages_by_member = {}
            for member_id, package in res.fetchall():
                packages_by_member.setdefault(member_id, [])

                # Ignore same package (no change)
                if package in packages_by_member[member_id]:
                    continue

                packages_by_member[member_id].append(package)

            changes = {}
            for member_id, packages in packages_by_member.items():
                if len(packages) == 1:
                    continue
                if len(packages) == 3:
                    packages = [packages[0], packages[2]]
                change_from, change_to = packages

                label_from = f"{change_from}-"
                changes.setdefault(label_from, 0)
                changes[label_from] -= 1

                label_to = f"{change_to}+"
                changes.setdefault(label_to, 0)
                changes[label_to] += 1

            yield {"date": date_start, **changes}
