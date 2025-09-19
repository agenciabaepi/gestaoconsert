import requests
from requests.auth import HTTPBasicAuth

def test_health_check_api():
    base_url = "http://localhost:3000"
    endpoint = f"{base_url}/api/health-check"
    auth = HTTPBasicAuth('wdglp', '123123')
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(endpoint, headers=headers, auth=auth, timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Health check API request failed: {e}"
    try:
        json_data = response.json()
    except ValueError:
        assert False, "Health check API did not return valid JSON"
    # Example expected response: {"status": "ok"} or similar status indicating health
    assert response.status_code == 200, f"Unexpected status code: {response.status_code}"
    assert isinstance(json_data, dict), "Response JSON is not a dictionary"
    assert "status" in json_data, "Response JSON missing 'status' field"
    # Validate that the status value indicates system is healthy
    valid_statuses = {"ok", "healthy", "up", "available"}
    assert json_data["status"].lower() in valid_statuses, f"Unexpected health status value: {json_data['status']}"

test_health_check_api()