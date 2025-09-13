import requests
from requests.auth import HTTPBasicAuth

def test_health_check_api_system_uptime_monitoring():
    base_url = "http://localhost:3000"
    endpoint = "/api/health-check"
    url = base_url + endpoint
    auth = HTTPBasicAuth("wdglp", "123123")
    headers = {
        "Accept": "application/json"
    }

    try:
        response = requests.get(url, auth=auth, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request to health check API failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not in JSON format"

    # Validate essential uptime/health keys presence and types if applicable
    # Since the schema is not detailed, ensure at least that a 'uptime' or 'status' key exists
    assert "uptime" in data or "status" in data, "Response JSON does not contain 'uptime' or 'status' key"

    if "uptime" in data:
        assert isinstance(data["uptime"], (int, float)), "'uptime' should be a number"
        assert data["uptime"] >= 0, "'uptime' should be non-negative"

    if "status" in data:
        assert isinstance(data["status"], str), "'status' should be a string"
        assert data["status"].lower() in ["healthy", "ok", "up"], "'status' should indicate healthy state"

test_health_check_api_system_uptime_monitoring()