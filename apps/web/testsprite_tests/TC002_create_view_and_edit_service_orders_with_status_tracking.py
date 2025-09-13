import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
AUTH = HTTPBasicAuth("wdglp", "123123")
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}

def test_create_view_edit_service_orders_with_status_tracking():
    new_order_id = None
    try:
        # Step 1: Create a new service order with initial status "pending"
        create_payload = {
            "empresa_id": "example-empresa-id",  # Required field
            "description": "Test service order creation",
            "status": "pending"
        }
        create_resp = requests.post(
            f"{BASE_URL}/api/ordens/criar",
            json=create_payload,
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT
        )
        assert create_resp.status_code == 201, f"Failed to create order: {create_resp.text}"
        order_data = create_resp.json()
        new_order_id = order_data.get("id")
        assert new_order_id is not None, "Created order ID not returned"

        # Step 2: View the created service order
        view_resp = requests.get(
            f"{BASE_URL}/api/ordens/{new_order_id}",
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT
        )
        assert view_resp.status_code == 200, f"Failed to view order: {view_resp.text}"
        viewed_order = view_resp.json()
        assert viewed_order.get("status") == "pending", "Initial status not pending"
        assert viewed_order.get("description") == "Test service order creation"

        # Step 3: Edit the order details (change description)
        edit_payload = {
            "description": "Updated test service order"
        }
        edit_resp = requests.put(
            f"{BASE_URL}/api/ordens/{new_order_id}",
            json=edit_payload,
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT
        )
        assert edit_resp.status_code == 200, f"Failed to edit order: {edit_resp.text}"
        edited_order = edit_resp.json()
        assert edited_order.get("description") == "Updated test service order"

        # Step 4: Update order status through its lifecycle and verify notification
        for status in ["in progress", "completed"]:
            status_payload = {"status": status}
            status_resp = requests.patch(
                f"{BASE_URL}/api/ordens/{new_order_id}/status",
                json=status_payload,
                headers=HEADERS,
                auth=AUTH,
                timeout=TIMEOUT
            )
            assert status_resp.status_code == 200, f"Failed to update status to {status}: {status_resp.text}"
            status_data = status_resp.json()
            assert status_data.get("status") == status, f"Status not updated to {status}"

            # Check notifications for status update
            notifications_resp = requests.get(
                f"{BASE_URL}/api/notifications?order_id={new_order_id}&status={status}",
                headers=HEADERS,
                auth=AUTH,
                timeout=TIMEOUT
            )
            assert notifications_resp.status_code == 200, f"Failed to fetch notifications for status {status}"
            notifications = notifications_resp.json()
            assert isinstance(notifications, list), "Notifications response is not a list"
            assert any(
                notification.get("order_id") == new_order_id and notification.get("status") == status
                for notification in notifications
            ), f"No notification found for status {status} update"

        # Step 5: Final view to confirm complete status
        final_view_resp = requests.get(
            f"{BASE_URL}/api/ordens/{new_order_id}",
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT
        )
        assert final_view_resp.status_code == 200, f"Failed to view order after status updates: {final_view_resp.text}"
        final_order = final_view_resp.json()
        assert final_order.get("status") == "completed", "Final order status is not completed"

    finally:
        # Cleanup: Delete the created service order if it exists
        if new_order_id:
            del_resp = requests.delete(
                f"{BASE_URL}/api/ordens/{new_order_id}",
                headers=HEADERS,
                auth=AUTH,
                timeout=TIMEOUT
            )
            if del_resp.status_code not in (200, 204):
                print(f"Warning: Unable to delete order {new_order_id}, status {del_resp.status_code}")

test_create_view_edit_service_orders_with_status_tracking()
