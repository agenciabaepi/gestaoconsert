import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
AUTH = HTTPBasicAuth("wdglp", "123123")
TIMEOUT = 30

def test_centralized_error_handling():
    """
    Test the centralized error handling utility by invoking an invalid endpoint
    to verify errors are properly caught, logged, and presented without crashing.
    """
    invalid_endpoint = f"{BASE_URL}/api/this-endpoint-does-not-exist"
    headers = {
        "Accept": "application/json",
    }

    try:
        response = requests.get(invalid_endpoint, auth=AUTH, headers=headers, timeout=TIMEOUT)
        # We expect a 4xx or 5xx error status code
        assert response.status_code >= 400, f"Expected error status code but got {response.status_code}"
        try:
            json_response = response.json()
            # Validate error structure
            assert "error" in json_response or "message" in json_response, "Error response should contain 'error' or 'message'"
            # The error message should be a non-empty string
            error_msg = json_response.get("error") or json_response.get("message")
            assert isinstance(error_msg, str) and len(error_msg) > 0, "Error message should be a non-empty string"
        except ValueError:
            # Response is not JSON, check if response text is non-empty as basic error indication
            assert response.text is not None, "Response text should be present even if not JSON"
    except requests.RequestException as e:
        assert False, f"Request failed unexpectedly: {e}"

test_centralized_error_handling()