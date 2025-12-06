import requests
import random
from uuid import uuid4
import time
import datetime



def random_date(start, end):
    """
    This function will return a random datetime between two datetime
    objects.
    """
    delta = end - start
    int_delta = (delta.days * 24 * 60 * 60) + delta.seconds
    random_second = random.randrange(int_delta)
    return start + datetime.timedelta(seconds=random_second)


headers = {
    "Content-Type": "application/json",
    "apiKey": "sb_publishable_NZhEVWBOlhXsHg5LlL-ZRQ_6JoZr82e",
    "Accept": "application/json"
}
base_url = "https://fteluhaoexouutmtrcas.supabase.co/rest/v1"

devices = requests.get(base_url + "/devices", headers=headers).json()
employes = requests.get(base_url + "/employes", headers=headers).json()
materials = requests.get(base_url + "/material", headers=headers).json()
tools = requests.get(base_url + "/tools", headers=headers).json()
rooms = requests.get(base_url + "/rooms", headers=headers).json()

max_employes = 4
max_materials = 2
max_tools = 3
max_devices = 2

time_steps = [15, 30, 45, 60]
min_date = datetime.datetime.strptime("2025-11-01T07:30:00", '%Y-%m-%dT%H:%M:%S')
max_date = datetime.datetime.strptime("2025-11-15T17:30:00", '%Y-%m-%dT%H:%M:%S')


def generate_operations_devices(operation_id: str):
    res = []
    for _ in range(random.randint(1, max_devices)):
        res.append(random.choice(devices))
    return res

def generate_operations_tools(operation_id: str):
    res = []
    for _ in range(random.randint(1, max_tools)):
        res.append(random.choice(tools))
    return res

def generate_operations_materials(operation_id: str):
    res = []
    for _ in range(random.randint(1, max_materials)):
        res.append(random.choice(tools))
    return res

def generate_operations_employes(operation_id: str):
    res = []
    for _ in range(random.randint(1, max_employes)):
        res.append(random.choice(tools))
    return res
def generate_operation(room_id: str = None):
    start_date = random_date(min_date, max_date)
    delay = random.choice(time_steps) if random.randint(0, 7) < 3 else 0

    operation = {
        "op_plan_start": start_date.isoformat(),
        "identifier": str(uuid4().hex),
        "room_id": room_id or random.choice(rooms)["id"]
    }

    current_time = start_date + datetime.timedelta(minutes=0)

    for k in ["an_real_start", "op_real_start", "op_real_end", "an_real_end", "op_plan_end"]:
        if k == "op_plan_end":
            current_time -= datetime.timedelta(minutes=delay)

        operation[k] = (current_time + datetime.timedelta(minutes=random.choice(time_steps) + delay)).isoformat()


    operation_id = str(uuid4())

    operation["id"] = operation_id

    # requests.post(base_url + f"/operations", headers=headers, json=operation)

    generate_operations_devices(operation_id)
    generate_operations_tools(operation_id)
    generate_operations_employes(operation_id)
    generate_operations_materials(operation_id)

    return operation

for r in rooms:
    for _ in range(random.randint(1, 20)):
        generate_operation(r["id"] if random.randint(0, 1) else None)



for r in rooms:
    for _ in range(random.randint(1, 20)):
        generate_operation(r["id"] if random.randint(0, 1) else None)