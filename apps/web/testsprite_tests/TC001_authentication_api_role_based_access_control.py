import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
USERNAME = "wdglp"
PASSWORD = "123123"

def test_authentication_api_role_based_access_control():
    """
    Verify that the authentication API correctly enforces role-based access control 
    for admins, technicians, and attendants, allowing access only to authorized routes 
    and functionalities.
    """

    auth = HTTPBasicAuth(USERNAME, PASSWORD)

    # Define role-based endpoints and the expected access rights
    # Since the PRD does not list specific role-based endpoints,
    # we will test common conceptual endpoints with their assumed role access:
    # - Admin-only endpoint
    # - Technician-only endpoint
    # - Attendant-only endpoint
    # For demonstration, we'll assume the following endpoints and expected status:

    role_endpoints = {
        "admin": {
            "endpoint": "/api/admin-saas/metrics",  # Admin SaaS metrics page (admin only)
            "allowed": True
        },
        "technician": {
            "endpoint": "/api/ordens/criar",  # Service order create page (technician allowed)
            "allowed": False  # Assuming only admin/attendant can create orders
        },
        "attendant": {
            "endpoint": "/api/clientes/route",  # Client management (attendant allowed)
            "allowed": True
        }
    }

    # 1. Authenticate user
    login_url = f"{BASE_URL}/api/auth/login"
    try:
        # Assuming POST login with basic auth returns token and role info
        login_response = requests.post(login_url, auth=auth, timeout=TIMEOUT)
        assert login_response.status_code == 200, f"Login failed with status {login_response.status_code}"
        login_data = login_response.json()
        assert "token" in login_data, "No token in login response"
        token = login_data["token"]
        # Also capture user role if provided
        user_role = login_data.get("role")
        assert user_role in ("admin", "technician", "attendant"), f"Unexpected user role: {user_role}"
    except requests.RequestException as e:
        assert False, f"Login request failed: {e}"

    headers = {"Authorization": f"Bearer {token}"}

    # Function to test access for a given endpoint expected to be allowed or denied
    def check_access(path, should_allow):
        url = f"{BASE_URL}{path}"
        try:
            response = requests.get(url, headers=headers, timeout=TIMEOUT)
            if should_allow:
                assert response.status_code == 200, (
                    f"Access denied to allowed endpoint {path} with status {response.status_code}"
                )
            else:
                assert response.status_code in (401, 403), (
                    f"Access allowed to disallowed endpoint {path} with status {response.status_code}"
                )
        except requests.RequestException as e:
            assert False, f"Request to {path} failed: {e}"

    # Test access to each role-based endpoint
    # The test user is with credentials for user 'wdglp' - assuming role from login response
    # Check if user role matches the expected allowed endpoints, else expect denial
    for role, info in role_endpoints.items():
        endpoint = info["endpoint"]
        allowed = info["allowed"]
        # If testing "allowed" for this user role, then allowed is True if user's role is that role
        # Adjust expectation accordingly:
        expected_access = (user_role == role and allowed) or (user_role != role and False)
        # For clearer test, test access assuming the logged user should only have allowed = True for their role endpoints
        # So if user role matches role, allowed is info['allowed'], else False
        check_access(endpoint, expected_access)

test_authentication_api_role_based_access_control()