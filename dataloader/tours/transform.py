from db import get_db


def calculate_tours_members_ratios_and_counts(date_window):
    for date_start, date_end in date_window():
        with get_db() as db:
            res = db.execute(
                """
                SELECT
                    COUNT(*) AS visitors,
                    COUNT(CASE WHEN is_member = FALSE THEN 1 END) AS non_members,
	                COUNT(CASE WHEN is_member = TRUE THEN 1 END) AS members
                FROM 
                    tours_reservations
                WHERE 
                    date_start <= :date_end
                    AND date_end >= :date_start
                GROUP BY name, date_start
                """,
                {"date_start": date_start, "date_end": date_end},
            )

            visitors_count = []
            non_members_count = []
            members_count = []

            for visitors, non_members, members in res.fetchall():
                visitors_count.append(visitors)
                non_members_count.append(non_members)
                members_count.append(members)

            yield {
                "date": date_start,
                "total": sum(visitors_count),
                "average_total": round(sum(visitors_count) / len(visitors_count), 1) if visitors_count else visitors_count,
                "members": sum(members_count),
                # "average_members": round(sum(members_count) / len(members_count), 1) if members_count else members_count,
                "non_members": sum(visitors_count) - sum(members_count),
                # "average_non_members": round(sum(non_members_count) / len(non_members_count), 1) if non_members_count else non_members_count
            }