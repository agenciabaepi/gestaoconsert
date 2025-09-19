import requests
import time

BASE_URL = "http://localhost:3000"
AUTH = ("wdglp", "123123")
TIMEOUT = 30

def test_payment_processing_api_mercadopago_integration():
    payment_id = None
    try:
        # Step 1: Create a payment
        payment_payload = {
            "amount": 15000,  # amount in cents as integer
            "currency_id": "ARS",
            "description": "Test Payment via Mercado Pago",
            "payment_method_id": "mercadopago",
            "external_reference": "test_ref_12345"
        }
        create_resp = requests.post(
            f"{BASE_URL}/api/pagamentos/criar",
            auth=AUTH,
            json=payment_payload,
            timeout=TIMEOUT
        )
        assert create_resp.status_code == 201, f"Expected 201 Created, got {create_resp.status_code}"
        payment_data = create_resp.json()
        assert "id" in payment_data, "Payment creation response missing 'id'"
        payment_id = payment_data["id"]

        # Step 2: Check payment status repeatedly until it is not pending or timeout after 60 seconds
        status = None
        start_time = time.time()
        while True:
            status_resp = requests.get(
                f"{BASE_URL}/api/pagamentos/status",
                auth=AUTH,
                params={"paymentId": payment_id},
                timeout=TIMEOUT
            )
            assert status_resp.status_code == 200, f"Expected 200 OK on status, got {status_resp.status_code}"
            status_data = status_resp.json()
            status = status_data.get("status")
            assert status is not None, "Status response missing 'status' field"

            if status.lower() != "pending" or time.time() - start_time > 60:
                break
            time.sleep(2)

        assert status.lower() in {"approved", "rejected", "cancelled", "pending"}, f"Unexpected payment status '{status}'"

        # Step 3: Reconcile payments
        reconcile_resp = requests.post(
            f"{BASE_URL}/api/pagamentos/reconciliar",
            auth=AUTH,
            timeout=TIMEOUT
        )
        assert reconcile_resp.status_code == 200, f"Expected 200 OK on reconciliation, got {reconcile_resp.status_code}"
        reconcile_data = reconcile_resp.json()
        assert isinstance(reconcile_data, dict), "Reconciliation response should be a JSON object"

        # Step 4: Simulate webhook call for payment update
        webhook_payload = {
            "id": payment_id,
            "type": "payment",
            "data": {
                "id": payment_id,
                "status": status
            }
        }
        webhook_resp = requests.post(
            f"{BASE_URL}/api/pagamentos/webhook",
            auth=AUTH,
            json=webhook_payload,
            timeout=TIMEOUT
        )
        assert webhook_resp.status_code in {200, 204}, f"Expected 200 or 204 on webhook, got {webhook_resp.status_code}"

    finally:
        # Clean up: attempt to delete the created payment if possible
        if payment_id:
            try:
                requests.delete(
                    f"{BASE_URL}/api/pagamentos/{payment_id}",
                    auth=AUTH,
                    timeout=TIMEOUT
                )
            except Exception:
                pass

test_payment_processing_api_mercadopago_integration()
