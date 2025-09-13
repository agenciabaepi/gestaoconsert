import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

auth_credential = {
    "username": "wdglp",
    "password": "123123"
}

def test_user_authentication_role_based_access_control():
    try:
        # Login with valid credentials
        login_response = requests.post(
            f"{BASE_URL}/api/login",
            json=auth_credential,
            timeout=TIMEOUT
        )
        assert login_response.status_code == 200, f"Login failed with status {login_response.status_code}"
        login_data = login_response.json()
        assert "token" in login_data, "Auth token not found in login response"
        token = login_data["token"]
        assert "role" in login_data, "User role not found in login response"
        user_role = login_data["role"]
        assert user_role in ["admin", "technician", "attendant"], f"Unexpected user role: {user_role}"

        headers = {"Authorization": f"Bearer {token}"}

        # Verify access to a protected route based on role
        protected_endpoint = f"{BASE_URL}/api/protected-route"
        protected_response = requests.get(protected_endpoint, headers=headers, timeout=TIMEOUT)
        assert protected_response.status_code == 200, f"Authorized user with role {user_role} couldn't access protected route"

        # Test unauthorized access with invalid token
        unauthorized_headers = {"Authorization": "Bearer invalidtoken123"}
        unauthorized_response = requests.get(protected_endpoint, headers=unauthorized_headers, timeout=TIMEOUT)
        assert unauthorized_response.status_code == 401, "Unauthorized access not blocked with invalid token"

        # Test unauthorized access without token
        no_token_response = requests.get(protected_endpoint, timeout=TIMEOUT)
        assert no_token_response.status_code == 401, "Unauthorized access not blocked without token"

    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

test_user_authentication_role_based_access_control()