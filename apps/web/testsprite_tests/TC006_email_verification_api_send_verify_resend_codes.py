import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
AUTH = HTTPBasicAuth("wdglp", "123123")
TIMEOUT = 30

def test_email_verification_api_send_verify_resend_codes():
    email = "testuser@example.com"
    usuarioId = "testuser123"
    nomeEmpresa = "Test Company"
    headers = {"Content-Type": "application/json"}

    # Send verification code
    send_payload = {"usuarioId": usuarioId, "email": email, "nomeEmpresa": nomeEmpresa}
    try:
        resp_send = requests.post(
            f"{BASE_URL}/api/email/enviar-codigo",
            json=send_payload,
            headers=headers,
            auth=AUTH,
            timeout=TIMEOUT,
        )
        assert resp_send.status_code == 200, f"Send code failed: {resp_send.text}"
        send_data = resp_send.json()
        assert "message" in send_data or "success" in send_data, "Unexpected send response format"

        # For testing verify code we need a code. Assuming API returns code in send response for testing.
        code = send_data.get("code")
        if not code:
            # If code not returned by send endpoint, we cannot verify. Fail test early.
            assert False, "Verification code not returned by send endpoint, cannot proceed with verify test"

        # Verify code
        verify_payload = {"email": email, "code": code}
        resp_verify = requests.post(
            f"{BASE_URL}/api/email/verificar-codigo",
            json=verify_payload,
            headers=headers,
            auth=AUTH,
            timeout=TIMEOUT,
        )
        assert resp_verify.status_code == 200, f"Verify code failed: {resp_verify.text}"
        verify_data = resp_verify.json()
        assert verify_data.get("verified") is True or verify_data.get("success") is True, "Code verification failed"

        # Resend code
        resend_payload = {"usuarioId": usuarioId, "email": email, "nomeEmpresa": nomeEmpresa}
        resp_resend = requests.post(
            f"{BASE_URL}/api/email/reenviar-codigo",
            json=resend_payload,
            headers=headers,
            auth=AUTH,
            timeout=TIMEOUT,
        )
        assert resp_resend.status_code == 200, f"Resend code failed: {resp_resend.text}"
        resend_data = resp_resend.json()
        assert "message" in resend_data or "success" in resend_data, "Unexpected resend response format"

    except requests.RequestException as e:
        assert False, f"HTTP request failed: {e}"

test_email_verification_api_send_verify_resend_codes()
