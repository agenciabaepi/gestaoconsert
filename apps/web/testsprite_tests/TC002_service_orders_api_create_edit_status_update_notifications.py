import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
AUTH = HTTPBasicAuth("wdglp", "123123")
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30

def test_service_orders_api_create_edit_status_update_notifications():
    service_order = None
    try:
        # Step 1: Create a new service order
        create_payload = {
            "empresa_id": "test-empresa-789",
            "cliente_id": "test-client-123",
            "tecnico_id": "test-tech-456",
            "description": "Initial creation of service order for testing",
            "equipment": "Laptop Model XYZ",
            "status": "pending",
            "dataPrevistaConclusao": "2025-09-20"
        }
        response_create = requests.post(
            f"{BASE_URL}/api/ordens/criar",
            json=create_payload,
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT,
        )
        assert response_create.status_code == 201, f"Create service order failed: {response_create.text}"
        service_order = response_create.json()
        assert "id" in service_order and service_order["id"], "Created service order must have an id"
        service_order_id = service_order["id"]

        # Verify initial status and details
        assert service_order["status"] == "pending"
        assert service_order["description"] == create_payload["description"]

        # Step 2: Edit the service order
        edit_payload = {
            "description": "Updated description after review",
            "equipment": "Laptop Model XYZ - updated specs",
        }
        response_edit = requests.put(
            f"{BASE_URL}/api/ordens/{service_order_id}",
            json=edit_payload,
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT,
        )
        assert response_edit.status_code == 200, f"Edit service order failed: {response_edit.text}"
        edited_order = response_edit.json()
        assert edited_order["description"] == edit_payload["description"]
        assert edited_order["equipment"] == edit_payload["equipment"]

        # Step 3: Update the status of the service order
        status_update_payload = {"status": "in-progress"}
        response_status_update = requests.patch(
            f"{BASE_URL}/api/ordens/{service_order_id}/status",
            json=status_update_payload,
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT,
        )
        assert response_status_update.status_code == 200, f"Status update failed: {response_status_update.text}"
        updated_status_order = response_status_update.json()
        assert updated_status_order["status"] == status_update_payload["status"]

        # Step 4: Verify notifications sent to client and technician
        # Assuming an endpoint exists like /api/notifications with query params to filter by order ID
        response_notifications = requests.get(
            f"{BASE_URL}/api/notifications?orderId={service_order_id}",
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT,
        )
        assert response_notifications.status_code == 200, f"Fetching notifications failed: {response_notifications.text}"
        notifications = response_notifications.json()
        # Expect at least two notifications: one to client, one to technician
        assert isinstance(notifications, list), "Notifications response should be a list"
        client_notif = any(n.get("recipientType") == "client" for n in notifications)
        tech_notif = any(n.get("recipientType") == "technician" for n in notifications)
        assert client_notif, "No notification found for client"
        assert tech_notif, "No notification found for technician"
    
    finally:
        # Cleanup: delete created service order if exists
        if service_order and "id" in service_order:
            requests.delete(
                f"{BASE_URL}/api/ordens/{service_order['id']}",
                headers=HEADERS,
                auth=AUTH,
                timeout=TIMEOUT,
            )

test_service_orders_api_create_edit_status_update_notifications()
