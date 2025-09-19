import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
AUTH = HTTPBasicAuth('wdglp', '123123')

def test_tc006_process_payments_via_mercado_pago():
    headers = {
        "Content-Type": "application/json"
    }

    # Sample payment data representing a successful payment scenario
    payment_data_success = {
        "order_id": "test-order-123",
        "payment_method": "mercado_pago",
        "amount": 100.00,
        "currency": "USD",
        "payer": {
            "email": "payer@example.com",
            "first_name": "John",
            "last_name": "Doe"
        },
        "payment_token": "valid_test_token"
    }

    # Sample payment data representing a failure payment scenario (e.g. invalid token)
    payment_data_failure = payment_data_success.copy()
    payment_data_failure["payment_token"] = "invalid_test_token"

    # The corrected endpoint for processing payment via Mercado Pago integration
    payment_endpoint = f"{BASE_URL}/api/mercado-pago/process"

    # Test successful payment processing
    try:
        response = requests.post(
            payment_endpoint,
            json=payment_data_success,
            headers=headers,
            auth=AUTH,
            timeout=TIMEOUT
        )
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        json_resp = response.json()
        assert "transaction_id" in json_resp and json_resp["transaction_id"], "Transaction ID missing in success response"
        assert json_resp.get("status") == "success", "Payment status not marked as success"
        assert "message" in json_resp and json_resp["message"], "Success message missing"
    except Exception as e:
        assert False, f"Successful payment processing raised exception: {e}"

    # Test failed payment processing
    try:
        response = requests.post(
            payment_endpoint,
            json=payment_data_failure,
            headers=headers,
            auth=AUTH,
            timeout=TIMEOUT
        )
        # Expected to fail, could be 400 or 402 or another client error according to implementation
        assert response.status_code in (400, 402, 401), f"Expected failure status code but got {response.status_code}"
        json_resp = response.json()
        assert json_resp.get("status") == "failure", "Payment failure status not returned properly"
        assert "error" in json_resp and json_resp["error"], "Error details missing in failure response"
    except Exception as e:
        assert False, f"Failed payment processing raised unexpected exception: {e}"

test_tc006_process_payments_via_mercado_pago()
