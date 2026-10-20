from typing import Any
from unittest.mock import patch, MagicMock
import pytest
import requests

from routing.exceptions import RoutingProviderError, NoRouteFoundError
from routing.integrations.routing.osrm import OSRMRoutingProvider


@pytest.mark.integration
class TestOSRMIntegration:
    """Integration tests for OSRM routing provider with fallback endpoints and waypoint synthesis."""

    def test_provider_initialization(self):
        """Verify OSRM provider initializes primary endpoint and fallback mirrors."""
        provider = OSRMRoutingProvider()
        assert len(provider.endpoints) >= 2
        assert "router.project-osrm.org" in provider.endpoints[0]

        custom_provider = OSRMRoutingProvider(endpoints=["https://osrm1.local", "https://osrm2.local"])
        assert custom_provider.endpoints == ["https://osrm1.local", "https://osrm2.local"]

    @patch("requests.get")
    def test_get_routes_success(self, mock_get: MagicMock):
        """Verify OSRM response parsing into RouteOption entities with distance, duration, and GeoJSON geometry."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "code": "Ok",
            "routes": [
                {
                    "distance": 290000.0,
                    "duration": 10800.0,
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [[-87.6298, 41.8781], [-86.1581, 39.7684]]
                    },
                    "legs": [{"summary": "I-65 S"}]
                }
            ]
        }
        mock_get.return_value = mock_response

        provider = OSRMRoutingProvider()
        routes = provider.get_routes((41.8781, -87.6298), (39.7684, -86.1581), num_alternatives=1)

        assert len(routes) == 1
        assert routes[0].id == "route_1"
        assert routes[0].summary == "I-65 S"
        assert routes[0].distance_miles > 170.0
        assert routes[0].duration_hours == 3.0

    @patch("requests.get")
    def test_fallback_mirror_when_primary_fails(self, mock_get: MagicMock):
        """Verify automatic failover to mirror endpoint when the primary OSRM server fails or times out."""
        def mock_request_dispatch(url, *args, **kwargs):
            if "router.project-osrm.org" in url:
                raise requests.RequestException("Primary endpoint connection refused")
            response = MagicMock()
            response.status_code = 200
            response.json.return_value = {
                "code": "Ok",
                "routes": [
                    {
                        "distance": 290000.0,
                        "duration": 10800.0,
                        "geometry": {"type": "LineString", "coordinates": [[-87.6, 41.8], [-86.1, 39.7]]},
                        "legs": [{"summary": "Fallback Highway"}]
                    }
                ]
            }
            return response

        mock_get.side_effect = mock_request_dispatch

        provider = OSRMRoutingProvider()
        routes = provider.get_routes((41.8781, -87.6298), (39.7684, -86.1581), num_alternatives=1)

        assert len(routes) == 1
        assert routes[0].summary == "Fallback Highway"

    @patch("requests.get")
    def test_synthesis_of_alternative_routes(self, mock_get: MagicMock):
        """Verify synthesis of distinct alternative routes via offset intermediate waypoints when OSRM returns fewer routes than requested."""
        call_count = [0]

        def mock_request_dispatch(url, *args, **kwargs):
            call_count[0] += 1
            response = MagicMock()
            response.status_code = 200
            # First call returns only 1 route
            if call_count[0] == 1:
                response.json.return_value = {
                    "code": "Ok",
                    "routes": [
                        {
                            "distance": 290000.0,
                            "duration": 10800.0,
                            "geometry": {"type": "LineString", "coordinates": [[-87.6, 41.8], [-86.1, 39.7]]},
                            "legs": [{"summary": "Primary Route"}]
                        }
                    ]
                }
            else:
                # Subsequent calls return synthesized offset routes with different distances
                response.json.return_value = {
                    "code": "Ok",
                    "routes": [
                        {
                            "distance": 290000.0 + (call_count[0] * 5000),
                            "duration": 10800.0 + (call_count[0] * 300),
                            "geometry": {"type": "LineString", "coordinates": [[-87.6, 41.8], [-86.1, 39.7]]},
                            "legs": [{"summary": f"Alternative via offset {call_count[0]}"}]
                        }
                    ]
                }
            return response

        mock_get.side_effect = mock_request_dispatch

        provider = OSRMRoutingProvider()
        routes = provider.get_routes((41.8781, -87.6298), (39.7684, -86.1581), num_alternatives=3)

        assert len(routes) == 3
        assert routes[0].id == "route_1"
        assert routes[1].id == "route_2"
        assert routes[2].id == "route_3"

    @patch("requests.get")
    def test_all_endpoints_fail_raises_runtime_error(self, mock_get: MagicMock):
        """Verify RoutingProviderError is raised when all configured OSRM endpoints fail."""
        mock_get.side_effect = requests.RequestException("Network unreachable")

        provider = OSRMRoutingProvider()
        with pytest.raises(RoutingProviderError, match="Failed to fetch routes from OSRM across all endpoints"):
            provider.get_routes((41.8781, -87.6298), (39.7684, -86.1581))

    @patch("requests.get")
    def test_all_endpoints_http_errors_raises_routing_provider_error(self, mock_get: MagicMock):
        """Verify RoutingProviderError (and not NoRouteFoundError) is raised when endpoints return HTTP 429 or 500."""
        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_response.text = "Too Many Requests"
        mock_get.return_value = mock_response

        provider = OSRMRoutingProvider()
        with pytest.raises(RoutingProviderError) as exc_info:
            provider.get_routes((41.8781, -87.6298), (39.7684, -86.1581))
        assert "429" in str(exc_info.value.details.get("last_error"))

    @patch("requests.get")
    def test_no_valid_routes_raises_runtime_error(self, mock_get: MagicMock):
        """Verify NoRouteFoundError is raised specifically when OSRM returns code 'NoRoute'."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"code": "NoRoute"}
        mock_get.return_value = mock_response

        provider = OSRMRoutingProvider()
        with pytest.raises(NoRouteFoundError, match="OSRM could not find valid routes"):
            provider.get_routes((41.8781, -87.6298), (39.7684, -86.1581))
