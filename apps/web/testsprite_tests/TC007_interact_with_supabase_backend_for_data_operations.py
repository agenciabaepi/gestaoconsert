import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
AUTH = HTTPBasicAuth("wdglp", "123123")
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}

def test_supabase_backend_crud_operations():
    # Removed user CRUD as no /api/users endpoint is defined in PRD
    user_id = "test_user_id"  # Placeholder user_id for order creation
    client_id = None
    equipment_id = None
    order_id = None
    try:
        # --- CLIENTS CRUD ---
        # 1. Create a client
        client_payload = {
            "name": "Test Client Supabase",
            "email": "client.supabase@example.com",
            "phone": "+5511999999999",
            "address": "Rua Exemplo, 123, São Paulo",
        }
        r = requests.post(
            f"{BASE_URL}/api/clientes",
            json=client_payload,
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT,
        )
        assert r.status_code == 201, f"Client creation failed: {r.text}"
        client_data = r.json()
        client_id = client_data.get("id")
        assert client_id is not None, "Client ID missing in creation response"

        # 2. Retrieve client
        r = requests.get(
            f"{BASE_URL}/api/clientes/{client_id}",
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT,
        )
        assert r.status_code == 200, f"Client retrieval failed: {r.text}"
        client_fetched = r.json()
        assert client_fetched["name"] == client_payload["name"]
        assert client_fetched["email"] == client_payload["email"]
        assert client_fetched["phone"] == client_payload["phone"]

        # 3. Update client phone
        update_client_payload = {"phone": "+5511988888888"}
        r = requests.put(
            f"{BASE_URL}/api/clientes/{client_id}",
            json=update_client_payload,
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT,
        )
        assert r.status_code == 200, f"Client update failed: {r.text}"
        updated_client = r.json()
        assert updated_client["phone"] == update_client_payload["phone"]

        # --- EQUIPMENT CRUD ---
        # 1. Create equipment linked to client
        equipment_payload = {
            "client_id": client_id,
            "type": "laptop",
            "brand": "Dell",
            "model": "XPS 13",
            "serial_number": "SN123456789",
            "notes": "Battery not charging",
        }
        r = requests.post(
            f"{BASE_URL}/api/equipamentos",
            json=equipment_payload,
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT,
        )
        assert r.status_code == 201, f"Equipment creation failed: {r.text}"
        equipment_data = r.json()
        equipment_id = equipment_data.get("id")
        assert equipment_id is not None, "Equipment ID missing in creation response"

        # 2. Retrieve equipment
        r = requests.get(
            f"{BASE_URL}/api/equipamentos/{equipment_id}",
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT,
        )
        assert r.status_code == 200, f"Equipment retrieval failed: {r.text}"
        equipment_fetched = r.json()
        assert equipment_fetched["type"] == equipment_payload["type"]
        assert equipment_fetched["brand"] == equipment_payload["brand"]
        assert equipment_fetched["client_id"] == client_id

        # 3. Update equipment notes
        update_equipment_payload = {"notes": "Battery replaced"}
        r = requests.put(
            f"{BASE_URL}/api/equipamentos/{equipment_id}",
            json=update_equipment_payload,
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT,
        )
        assert r.status_code == 200, f"Equipment update failed: {r.text}"
        updated_equipment = r.json()
        assert updated_equipment["notes"] == update_equipment_payload["notes"]

        # --- ORDERS CRUD ---
        # 1. Create an order linking user, client and equipment
        order_payload = {
            "user_id": user_id,
            "client_id": client_id,
            "equipment_id": equipment_id,
            "description": "Battery replacement service order",
            "status": "pending"
        }
        r = requests.post(
            f"{BASE_URL}/api/ordens",
            json=order_payload,
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT,
        )
        assert r.status_code == 201, f"Order creation failed: {r.text}"
        order_data = r.json()
        order_id = order_data.get("id")
        assert order_id is not None, "Order ID missing in creation response"

        # 2. Retrieve order
        r = requests.get(
            f"{BASE_URL}/api/ordens/{order_id}",
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT,
        )
        assert r.status_code == 200, f"Order retrieval failed: {r.text}"
        order_fetched = r.json()
        assert order_fetched["description"] == order_payload["description"]
        assert order_fetched["status"] == "pending"
        assert order_fetched["user_id"] == user_id
        assert order_fetched["client_id"] == client_id
        assert order_fetched["equipment_id"] == equipment_id

        # 3. Update order status to 'in progress'
        update_order_payload = {"status": "in progress"}
        r = requests.put(
            f"{BASE_URL}/api/ordens/{order_id}",
            json=update_order_payload,
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT,
        )
        assert r.status_code == 200, f"Order update failed: {r.text}"
        updated_order = r.json()
        assert updated_order["status"] == "in progress"

    finally:
        # Cleanup created resources in reverse dependency order

        if order_id:
            try:
                r = requests.delete(
                    f"{BASE_URL}/api/ordens/{order_id}",
                    headers=HEADERS,
                    auth=AUTH,
                    timeout=TIMEOUT,
                )
                assert r.status_code in [200, 204], f"Order deletion failed: {r.text}"
            except Exception:
                pass

        if equipment_id:
            try:
                r = requests.delete(
                    f"{BASE_URL}/api/equipamentos/{equipment_id}",
                    headers=HEADERS,
                    auth=AUTH,
                    timeout=TIMEOUT,
                )
                assert r.status_code in [200, 204], f"Equipment deletion failed: {r.text}"
            except Exception:
                pass

        if client_id:
            try:
                r = requests.delete(
                    f"{BASE_URL}/api/clientes/{client_id}",
                    headers=HEADERS,
                    auth=AUTH,
                    timeout=TIMEOUT,
                )
                assert r.status_code in [200, 204], f"Client deletion failed: {r.text}"
            except Exception:
                pass

test_supabase_backend_crud_operations()
