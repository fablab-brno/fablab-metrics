from datetime import datetime
from dateutil.relativedelta import relativedelta

from db import get_db


def calculate_tours_members_ratios_and_counts(date_window):
    memberships = []
    last_date = datetime.today().replace(day=1) + relativedelta(months=1)

    for date_start, date_end in date_window():
        if date_end > last_date:
            break

        with get_db() as db:
            res = db.execute(
                """
                SELECT
                    COUNT(*) AS total_registrations,
                    COUNT(CASE WHEN state != 4 THEN 1 END) AS non_attendees,
                    COUNT(CASE WHEN (is_member = FALSE AND state = 4) THEN 1 END) AS non_members_visitors,
                    COUNT(CASE WHEN (is_member = TRUE AND state = 4) THEN 1 END) AS members_visitors
                FROM 
                    tours_reservations
                WHERE 
                    date_start <= :date_end
                    AND date_end >= :date_start
                GROUP BY name, date_start
                """,
                {"date_start": date_start, "date_end": date_end},
            )

            total_registrations = []
            non_attendees_count = []
            non_members_count = []
            members_count = []

            for registrations, non_attendees, non_members, members in res.fetchall():
                total_registrations.append(registrations)
                non_attendees_count.append(non_attendees)
                non_members_count.append(non_members)
                members_count.append(members)

            memberships_res = db.execute(
                """
                SELECT COUNT(*) as count, membership.member_id
                FROM membership
                JOIN tours_reservations ON tours_reservations.member_id = membership.member_id
                WHERE membership.date_start > tours_reservations.date_start
                AND membership.date_start < date(tours_reservations.date_start, '+3 months')
                AND tours_reservations.date_start >= :date_start
                AND tours_reservations.date_start < :date_end
                GROUP BY membership.member_id
                """,
                {"date_start": date_start, "date_end": date_end},
            )

            purchased_membership = [{
                "count": count,
                "member_id": member_id
            } for count, member_id in memberships_res.fetchall()]
            memberships += purchased_membership

            yield {
                "date": date_start,
                "total_registrations": sum(total_registrations),
                "average_total": round(sum(total_registrations) / len(total_registrations), 1) if total_registrations else total_registrations,
                "attendees_count": round(sum(total_registrations) - sum(non_attendees_count)),
                "non_attendees_count": sum(non_attendees_count),
                "purchased_memberships": len(purchased_membership)
            }

    pass

def get_memberships_in_three_months(date_window):
    for date_start, date_end in date_window():
        with get_db() as db:
            res = db.execute(
                """
                SELECT
                    COUNT(*) AS visitors,
                    COUNT(CASE WHEN is_member = FALSE THEN 1 END) AS non_members,
	                COUNT(CASE WHEN is_member = TRUE THEN 1 END) AS members
                FROM 
                    membership
                WHERE 
                    date_start <= :date_end
                    AND date_end >= :date_start
                    AND (
                        package = 'Mistr'
                        OR package = 'Učedník'
                        OR package = 'Tovaryš'
                    )
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