from db import get_db
from reenio import ReenioSession
from fabman import FabmanSession
from settings import get_settings
from utils.dict import dot_path

settings = get_settings()


def extract_tours_reservations_logs(date_start, date_end, lang: str):
    with ReenioSession(lang) as s:
        logs = s.list_tours_reservations_logs(date_start, date_end)

        def get_customer_email(customer_id: int):
            customer_data = s.request("get", f'customer/{customer_id}').json()
            return customer_data["detail"]["email"]

        reservations = [
            {
                "id": l["id"],
                "name": l["name"],
                "date_start": l["start"].split("T")[0],
                "date_end": l["end"].split("T")[0],
                "customer_id": l["customer"]["id"],
                "customer_email": get_customer_email(l["customer"]["id"])
            } for l in logs
        ]

    with get_db() as db:
        db.executemany(
            """
            REPLACE INTO tours_reservations (id, name, date_start, date_end, customer_id, customer_email) 
            VALUES (:id, :name, :date_start, :date_end, :customer_id, :customer_email)
            """,
            reservations
        )

def extract_members_emails():
    with FabmanSession() as s:
        all_members = s.list_members()

    members_emails = [
        {
            "id": m["id"],
            "email": m["emailAddress"]
        }
        for m in all_members
    ]

    with get_db() as db:
        db.executemany(
            """
            UPDATE tours_reservations SET is_member = TRUE
            WHERE customer_email = :email
            """,
            members_emails,
        )

        db.execute(
            """
            UPDATE tours_reservations SET customer_email = ''
            """
        )