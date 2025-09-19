import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
AUTH = HTTPBasicAuth("wdglp", "123123")
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}


def test_manage_client_information_with_service_history_tracking():
    # Create a new client
    client_data = {
        "nome": "Test Client",
        "email": "testclient@example.com",
        "phone": "555-1234",
        "address": "123 Test St",
        "notes": "Initial notes",
        "empresaId": 1
    }
    client_id = None
    try:
        # Create client
        create_response = requests.post(
            f"{BASE_URL}/api/clientes",
            json=client_data,
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert create_response.status_code == 201, f"Failed to create client: {create_response.text}"
        created_client = create_response.json()
        assert "id" in created_client, "Client creation response missing 'id'"
        client_id = created_client["id"]

        # View client details
        view_response = requests.get(
            f"{BASE_URL}/api/clientes/{client_id}",
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert view_response.status_code == 200, f"Failed to get client details: {view_response.text}"
        client_details = view_response.json()
        # Validate client details fields
        for key in client_data:
            assert client_details.get(key) == client_data[key], f"Client field {key} mismatch"

        # Edit client details (update notes)
        updated_data = {"notes": "Updated notes for client"}
        edit_response = requests.put(
            f"{BASE_URL}/api/clientes/{client_id}",
            json=updated_data,
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert edit_response.status_code == 200, f"Failed to edit client: {edit_response.text}"
        edited_client = edit_response.json()
        assert edited_client.get("notes") == updated_data["notes"], "Client notes not updated"

        # Retrieve service history related to client
        service_history_response = requests.get(
            f"{BASE_URL}/api/clientes/{client_id}/service-history",
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert service_history_response.status_code == 200, f"Failed to get service history: {service_history_response.text}"
        service_history = service_history_response.json()
        # Service history expected to be a list (can be empty)
        assert isinstance(service_history, list), "Service history is not a list"

    finally:
        # Clean up - delete the created client if exists
        if client_id:
            requests.delete(
                f"{BASE_URL}/api/clientes/{client_id}",
                auth=AUTH,
                headers=HEADERS,
                timeout=TIMEOUT
            )


test_manage_client_information_with_service_history_tracking()