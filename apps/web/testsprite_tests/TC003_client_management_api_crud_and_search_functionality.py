import requests
from requests.auth import HTTPBasicAuth


BASE_URL = "http://localhost:3000"
AUTH = HTTPBasicAuth("wdglp", "123123")
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}


def test_client_management_api_crud_and_search():
    client_id = None
    equipment_id = None

    # Prepare payloads
    client_payload = {
        "empresaId": 1,
        "nome": "Test Client",
        "email": "testclient@example.com",
        "phone": "1234567890",
        "address": "123 Test Street"
    }
    equipment_payload = {
        "type": "Laptop",
        "brand": "TestBrand",
        "model": "TestModel X1",
        "serial_number": "SN123456789"
    }
    updated_client_payload = {
        "empresaId": 1,
        "nome": "Updated Test Client",
        "email": "updatedclient@example.com",
        "phone": "0987654321",
        "address": "321 Updated Ave"
    }
    updated_equipment_payload = {
        "type": "Smartphone",
        "brand": "UpdatedBrand",
        "model": "UpdatedModel S9",
        "serial_number": "SN987654321"
    }

    try:
        # Create Client (POST /api/clientes)
        resp = requests.post(
            f"{BASE_URL}/api/clientes",
            json=client_payload,
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert resp.status_code == 201, f"Client creation failed: {resp.text}"
        client_data = resp.json()
        assert "id" in client_data, "Created client missing id"
        client_id = client_data["id"]

        # Create Equipment for Client (POST /api/clientes/{client_id}/equipamentos)
        resp = requests.post(
            f"{BASE_URL}/api/clientes/{client_id}/equipamentos",
            json=equipment_payload,
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert resp.status_code == 201, f"Equipment creation failed: {resp.text}"
        equipment_data = resp.json()
        assert "id" in equipment_data, "Created equipment missing id"
        equipment_id = equipment_data["id"]

        # Read Client (GET /api/clientes/{client_id})
        resp = requests.get(
            f"{BASE_URL}/api/clientes/{client_id}",
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert resp.status_code == 200, f"Failed to get client: {resp.text}"
        client_fetched = resp.json()
        for key in client_payload:
            if key != "empresaId":  # empresaId may or may not be returned in the client payload fetch
                assert client_fetched.get(key) == client_payload[key], f"Client {key} mismatch"

        # Read Equipment (GET /api/clientes/{client_id}/equipamentos/{equipment_id})
        resp = requests.get(
            f"{BASE_URL}/api/clientes/{client_id}/equipamentos/{equipment_id}",
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert resp.status_code == 200, f"Failed to get equipment: {resp.text}"
        equipment_fetched = resp.json()
        for key in equipment_payload:
            assert equipment_fetched.get(key) == equipment_payload[key], f"Equipment {key} mismatch"

        # Update Client (PUT /api/clientes/{client_id})
        resp = requests.put(
            f"{BASE_URL}/api/clientes/{client_id}",
            json=updated_client_payload,
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert resp.status_code == 200, f"Client update failed: {resp.text}"
        updated_client = resp.json()
        for key in updated_client_payload:
            if key != "empresaId":  # empresaId may not be returned after update
                assert updated_client.get(key) == updated_client_payload[key], f"Updated client {key} mismatch"

        # Update Equipment (PUT /api/clientes/{client_id}/equipamentos/{equipment_id})
        resp = requests.put(
            f"{BASE_URL}/api/clientes/{client_id}/equipamentos/{equipment_id}",
            json=updated_equipment_payload,
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert resp.status_code == 200, f"Equipment update failed: {resp.text}"
        updated_equipment = resp.json()
        for key in updated_equipment_payload:
            assert updated_equipment.get(key) == updated_equipment_payload[key], f"Updated equipment {key} mismatch"

        # Search Clients (GET /api/clientes?search=Updated)
        resp = requests.get(
            f"{BASE_URL}/api/clientes",
            params={"search": "Updated"},
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert resp.status_code == 200, f"Client search failed: {resp.text}"
        clients_list = resp.json()
        assert isinstance(clients_list, list), "Search response is not a list"
        assert any(client.get("id") == client_id for client in clients_list), "Updated client not found in search results"

        # Search Equipment (GET /api/clientes/{client_id}/equipamentos?search=UpdatedBrand)
        resp = requests.get(
            f"{BASE_URL}/api/clientes/{client_id}/equipamentos",
            params={"search": "UpdatedBrand"},
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert resp.status_code == 200, f"Equipment search failed: {resp.text}"
        equipments_list = resp.json()
        assert isinstance(equipments_list, list), "Search response is not a list"
        assert any(eq.get("id") == equipment_id for eq in equipments_list), "Updated equipment not found in search results"

        # Delete Equipment (DELETE /api/clientes/{client_id}/equipamentos/{equipment_id})
        resp = requests.delete(
            f"{BASE_URL}/api/clientes/{client_id}/equipamentos/{equipment_id}",
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert resp.status_code in (200, 204), f"Equipment deletion failed: {resp.text}"

        # Delete Client (DELETE /api/clientes/{client_id})
        resp = requests.delete(
            f"{BASE_URL}/api/clientes/{client_id}",
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert resp.status_code in (200, 204), f"Client deletion failed: {resp.text}"

        # Verify Deletion of Client (GET should return 404)
        resp = requests.get(
            f"{BASE_URL}/api/clientes/{client_id}",
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert resp.status_code == 404, "Deleted client still accessible"

        # Verify Deletion of Equipment (GET should return 404)
        resp = requests.get(
            f"{BASE_URL}/api/clientes/{client_id}/equipamentos/{equipment_id}",
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        # If equipment already deleted by client deletion, 404 or error is acceptable
        assert resp.status_code == 404 or resp.status_code == 400, "Deleted equipment still accessible"

    except requests.RequestException as e:
        assert False, f"Request exception occurred: {e}"


test_client_management_api_crud_and_search()
