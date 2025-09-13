import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
AUTH = HTTPBasicAuth("wdglp", "123123")
TIMEOUT = 30

def test_send_and_receive_whatsapp_messages():
    headers = {"Content-Type": "application/json"}

    # Step 1: Connect to WhatsApp
    try:
        connect_resp = requests.post(
            f"{BASE_URL}/api/whatsapp/connect",
            auth=AUTH,
            headers=headers,
            timeout=TIMEOUT
        )
        assert connect_resp.status_code == 200, f"WhatsApp connect failed: {connect_resp.text}"
        connect_data = connect_resp.json()
        assert "status" in connect_data, "No status field in connect response"
        assert connect_data["status"] in ("connected", "connecting", "disconnected"), "Unexpected connection status"

        # Step 2: Send a WhatsApp message
        message_payload = {
            "to": "5511999999999",  # Example phone number in international format
            "message": "Test message from automated test."
        }
        send_resp = requests.post(
            f"{BASE_URL}/api/whatsapp/enviar",
            auth=AUTH,
            headers=headers,
            json=message_payload,
            timeout=TIMEOUT
        )
        assert send_resp.status_code == 200, f"WhatsApp send message failed: {send_resp.text}"
        send_data = send_resp.json()
        assert "messageId" in send_data or "id" in send_data, "No message ID returned"
        assert send_data.get("status", "sent") in ("sent", "delivered", "queued"), "Unexpected message status"

        # Optionally, if there's a way to verify receiving messages, test receipt
        # There was no explicit API in PRD for receiving messages, so skipping.
    except requests.RequestException as e:
        assert False, f"Request failed with exception: {e}"

test_send_and_receive_whatsapp_messages()