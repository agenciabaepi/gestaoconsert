import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
AUTH = HTTPBasicAuth("wdglp", "123123")
TIMEOUT = 30
HEADERS = {"Accept": "application/json"}

def test_render_reusable_ui_components_consistently():
    """
    This test checks the backend endpoints related to reusable UI components to ensure they render
    correctly and consistently with accessibility support.
    
    Since the PRD does not specify direct API endpoints for UI components rendering,
    we assume there is an endpoint /api/ui-components that returns metadata or configuration
    that the frontend uses to render these components.
    
    We will validate:
    - The endpoint returns success
    - The response includes all expected UI components keys: Badge, Button, Dialog, Input, Select, Toast
    - The accessibility attributes or flags are included in the response for each component
    """

    url = f"{BASE_URL}/api/ui-components"
    try:
        response = requests.get(url, auth=AUTH, headers=HEADERS, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected status 200 but got {response.status_code}"
        data = response.json()

        expected_components = ["Badge", "Button", "Dialog", "Input", "Select", "Toast"]
        assert all(comp in data for comp in expected_components), \
            f"Response is missing expected components. Found keys: {list(data.keys())}"

        for comp in expected_components:
            comp_data = data.get(comp, {})
            # Check expected accessibility support flags or attributes presence
            # Assuming each component includes an 'accessibility' dict describing support
            assert "accessibility" in comp_data, f"Accessibility info missing in component {comp}"
            accessibility_info = comp_data["accessibility"]
            assert isinstance(accessibility_info, dict), f"Accessibility info for {comp} should be a dict"
            # For example, check common accessibility keys exist such as 'ariaLabel', 'keyboardNavigation'
            assert "ariaLabel" in accessibility_info, f"'ariaLabel' missing in accessibility info of {comp}"
            assert "keyboardNavigation" in accessibility_info, \
                f"'keyboardNavigation' missing in accessibility info of {comp}"
            
    except requests.RequestException as e:
        assert False, f"Request to {url} failed with exception: {e}"
    except ValueError as e:
        assert False, f"Response JSON decode failed: {e}"

test_render_reusable_ui_components_consistently()