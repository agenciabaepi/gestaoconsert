import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
AUTH = HTTPBasicAuth("wdglp", "123123")
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30

def test_whatsapp_integration_api_message_sending_and_connection_management():
    session = requests.Session()
    session.auth = AUTH
    session.headers.update(HEADERS)
    connection_id = None

    try:
        # 1. Connect to WhatsApp
        connect_resp = session.post(f"{BASE_URL}/api/whatsapp/connect", json={}, timeout=TIMEOUT)
        assert connect_resp.status_code == 200, f"Failed to connect WhatsApp: {connect_resp.text}"
        connect_data = connect_resp.json()
        assert "connectionId" in connect_data, "connectionId not returned on connect"
        connection_id = connect_data["connectionId"]

        # 2. Send a WhatsApp message using the connectionId
        message_payload = {
            "connectionId": connection_id,
            "to": "5511999999999@c.us",
            "message": "Test message from integration API"
        }
        send_resp = session.post(f"{BASE_URL}/api/whatsapp/enviar", json=message_payload, timeout=TIMEOUT)
        assert send_resp.status_code == 200, f"Failed to send message: {send_resp.text}"
        send_data = send_resp.json()
        assert send_data.get("success") is True or send_data.get("messageId"), "Message sending was not successful"

        # 3. Verify connection status (optional GET or a status endpoint if exists)
        # Assuming no explicit endpoint given, skipping.

        # 4. Disconnect WhatsApp connection
        disconnect_payload = {"connectionId": connection_id}
        disconnect_resp = session.post(f"{BASE_URL}/api/whatsapp/disconnect", json=disconnect_payload, timeout=TIMEOUT)
        assert disconnect_resp.status_code == 200, f"Failed to disconnect WhatsApp: {disconnect_resp.text}"
        disconnect_data = disconnect_resp.json()
        assert disconnect_data.get("disconnected") is True or disconnect_data.get("success") is True, "Disconnect not successful"

    finally:
        # Cleanup: Ensure disconnection in case test failed before disconnect
        if connection_id:
            try:
                session.post(f"{BASE_URL}/api/whatsapp/disconnect", json={"connectionId": connection_id}, timeout=TIMEOUT)
            except Exception:
                pass

test_whatsapp_integration_api_message_sending_and_connection_management()
