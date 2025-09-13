import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
AUTH = HTTPBasicAuth("wdglp", "123123")
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30


def test_manage_equipment_details_associated_with_service_orders():
    equipment_id = None
    service_order_id = None
    try:
        # Step 1: Create a new service order (to associate equipment)
        service_order_payload = {
            "title": "Test Service Order for Equipment",
            "description": "Service order created for testing equipment management",
            "status": "pending",
            "empresa_id": 1  # added required field
        }
        so_response = requests.post(
            f"{BASE_URL}/api/ordens/criar",
            json=service_order_payload,
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT,
        )
        assert so_response.status_code == 201, f"Failed to create service order: {so_response.text}"
        service_order_data = so_response.json()
        service_order_id = service_order_data.get("id")
        assert service_order_id is not None, "Service order ID not returned"

        # Step 2: Add new equipment linked to the created service order
        equipment_payload = {
            "name": "Test Equipment Model X",
            "serial_number": "SN1234567890",
            "manufacturer": "TestCorp",
            "model": "Model X",
            "service_order_id": service_order_id,
            "description": "Equipment added for testing",
        }
        eq_response = requests.post(
            f"{BASE_URL}/api/equipamentos",
            json=equipment_payload,
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT,
        )
        assert eq_response.status_code == 201, f"Failed to create equipment: {eq_response.text}"
        equipment_data = eq_response.json()
        equipment_id = equipment_data.get("id")
        assert equipment_id is not None, "Equipment ID not returned"
        assert equipment_data.get("name") == equipment_payload["name"]
        assert equipment_data.get("service_order_id") == service_order_id

        # Step 3: View equipment details by ID
        get_eq_response = requests.get(
            f"{BASE_URL}/api/equipamentos/{equipment_id}",
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT,
        )
        assert get_eq_response.status_code == 200, f"Failed to get equipment: {get_eq_response.text}"
        get_eq_data = get_eq_response.json()
        assert get_eq_data.get("id") == equipment_id
        assert get_eq_data.get("service_order_id") == service_order_id

        # Step 4: Edit equipment details (update the description)
        updated_description = "Updated equipment description for test"
        update_payload = {
            "description": updated_description
        }
        put_eq_response = requests.put(
            f"{BASE_URL}/api/equipamentos/{equipment_id}",
            json=update_payload,
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT,
        )
        assert put_eq_response.status_code == 200, f"Failed to update equipment: {put_eq_response.text}"
        put_eq_data = put_eq_response.json()
        assert put_eq_data.get("description") == updated_description

        # Step 5: Verify equipment service history is tracked correctly
        service_history_response = requests.get(
            f"{BASE_URL}/api/equipamentos/{equipment_id}/service-history",
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT,
        )
        assert service_history_response.status_code == 200, f"Failed to get service history: {service_history_response.text}"
        history_data = service_history_response.json()
        assert isinstance(history_data, list), "Service history is not a list"
        # Since it's a new equipment, history might be empty or contain initial creation entry
        # Check for at least one entry or empty list is accepted
        for entry in history_data:
            assert "date" in entry and "description" in entry, "Service history entry missing fields"

    finally:
        # Cleanup: Delete the created equipment and service order if they exist
        if equipment_id:
            try:
                requests.delete(
                    f"{BASE_URL}/api/equipamentos/{equipment_id}",
                    headers=HEADERS,
                    auth=AUTH,
                    timeout=TIMEOUT,
                )
            except Exception:
                pass

        if service_order_id:
            try:
                requests.delete(
                    f"{BASE_URL}/api/ordens/{service_order_id}",
                    headers=HEADERS,
                    auth=AUTH,
                    timeout=TIMEOUT,
                )
            except Exception:
                pass


test_manage_equipment_details_associated_with_service_orders()