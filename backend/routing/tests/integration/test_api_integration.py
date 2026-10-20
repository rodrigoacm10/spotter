from typing import Any
from unittest.mock import patch
import pytest
from rest_framework.test import APIClient
from ..factories import AnalyzeTripPayloadFactory


@pytest.mark.integration
@pytest.mark.django_db
class TestApiIntegration:
    """Integration tests for Django REST Framework API views."""

    def test_health_check_endpoint(self):
        """Verify GET /api/health/ returns status 200 and system health indicator."""
        client = APIClient()
        response: Any = client.get("/api/health/")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        assert response.json()["service"] == "spotter-backend"

    def test_geocode_endpoint_validation_error(self):
        """Verify GET /api/geocode/ returns 400 Bad Request when required parameter 'q' is missing or too short."""
        client = APIClient()
        response: Any = client.get("/api/geocode/")
        assert response.status_code == 400
        assert "q" in response.json()

        response_short: Any = client.get("/api/geocode/?q=a")
        assert response_short.status_code == 400

    @patch("routing.views.search_locations")
    def test_geocode_endpoint_success(self, mock_search):
        """Verify GET /api/geocode/ returns 200 OK with formatted location suggestions."""
        mock_search.return_value = [
            {
                "display_name": "Chicago, Cook County, Illinois, United States",
                "latitude": 41.8781,
                "longitude": -87.6298,
                "type": "city"
            }
        ]
        client = APIClient()
        response: Any = client.get("/api/geocode/?q=Chicago&limit=1")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["display_name"] == "Chicago, Cook County, Illinois, United States"
        mock_search.assert_called_once_with(query="Chicago", limit=1)

    def test_analyze_endpoint_validation_error(self):
        """Verify POST /api/routes/analyze/ returns 400 Bad Request for incomplete payloads or invalid sampling intervals."""
        client = APIClient()
        response: Any = client.post("/api/routes/analyze/", {}, format="json")
        assert response.status_code == 400

        payload = AnalyzeTripPayloadFactory.build(sample_interval_miles=15.0)
        res_invalid_interval: Any = client.post("/api/routes/analyze/", payload, format="json")
        assert res_invalid_interval.status_code == 400
        assert "sample_interval_miles" in res_invalid_interval.json()

    def test_analyze_endpoint_success(self, monkeypatch, mock_routing_provider, mock_weather_provider):
        """Verify POST /api/routes/analyze/ returns 200 OK with recommended routes and aggregated risk metrics."""
        monkeypatch.setattr("routing.services.trip_analysis.OSRMRoutingProvider", lambda: mock_routing_provider)
        monkeypatch.setattr("routing.services.trip_analysis.OpenMeteoWeatherProvider", lambda: mock_weather_provider)

        client = APIClient()
        payload = AnalyzeTripPayloadFactory.build(sample_interval_miles=50.0)
        response: Any = client.post("/api/routes/analyze/", payload, format="json")
        assert response.status_code == 200
        data = response.json()
        assert "routes" in data
        assert len(data["routes"]) == 1
        assert data["routes"][0]["is_recommended"] is True
        assert data["routes"][0]["summary"] == "Via I-65 S"

    @patch("routing.views.analyze_trip")
    def test_analyze_endpoint_internal_error_handling(self, mock_analyze):
        """Verify POST /api/routes/analyze/ handles unhandled exceptions by returning 500 Internal Server Error without leaking details."""
        mock_analyze.side_effect = RuntimeError("External routing provider timeout")

        client = APIClient()
        payload = AnalyzeTripPayloadFactory.build()
        response: Any = client.post("/api/routes/analyze/", payload, format="json")
        assert response.status_code == 500
        data = response.json()
        assert data["code"] == "internal_server_error"
        assert data["message"] == "An unexpected server error occurred while processing the request."
        assert "External routing provider timeout" not in str(data)

    def test_openapi_schema_generation_and_validation(self):
        """Verify spectacular generates valid OpenAPI 3 schema without warnings or schema errors."""
        from django.core.management import call_command
        import io
        out = io.StringIO()
        call_command("spectacular", "--validate", "--fail-on-warn", stdout=out)
        output = out.getvalue()
        assert "TripAnalysisResponse" in output
        assert "ErrorResponse" in output
