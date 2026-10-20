from typing import Any
from unittest.mock import patch, MagicMock
import pytest
import requests

from routing.integrations.geocoding import NominatimGeocodingProvider


@pytest.mark.integration
class TestNominatimIntegration:
    """Integration tests for OpenStreetMap Nominatim geocoding provider."""

    def test_provider_initialization(self):
        """Verify default Nominatim base URL and custom headers configuration."""
        provider = NominatimGeocodingProvider()
        assert "nominatim.openstreetmap.org" in provider.base_url
        assert "User-Agent" in provider.headers

        custom_provider = NominatimGeocodingProvider(base_url="https://custom-nominatim.local/search")
        assert custom_provider.base_url == "https://custom-nominatim.local/search"

    def test_short_query_skips_network(self):
        """Verify that short (<2 chars) or blank queries return immediately without performing HTTP network requests."""
        provider = NominatimGeocodingProvider()
        with patch("requests.get") as mock_get:
            assert provider.search_locations("") == []
            assert provider.search_locations("a") == []
            assert provider.search_locations("  ") == []
            mock_get.assert_not_called()

    @patch("requests.get")
    def test_search_locations_success(self, mock_get: MagicMock):
        """Verify successful response parsing and normalization of place names, coordinates, and types."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {
                "display_name": "Chicago, Cook County, Illinois, United States",
                "lat": "41.8781",
                "lon": "-87.6298",
                "type": "city"
            },
            {
                "display_name": "Chicago Ridge, Cook County, Illinois, United States",
                "lat": "41.7025",
                "lon": "-87.7781",
                "type": "village"
            }
        ]
        mock_get.return_value = mock_response

        provider = NominatimGeocodingProvider()
        results = provider.search_locations("Chicago", limit=2)

        assert len(results) == 2
        assert results[0]["display_name"] == "Chicago, Cook County, Illinois, United States"
        assert results[0]["latitude"] == 41.8781
        assert results[0]["longitude"] == -87.6298
        assert results[0]["type"] == "city"
        mock_get.assert_called_once()

    @patch("requests.get")
    def test_search_locations_network_failure(self, mock_get: MagicMock):
        """Verify that network exceptions (timeouts, DNS failures) return an empty list safely without crashing."""
        mock_get.side_effect = requests.RequestException("DNS lookup failed")

        provider = NominatimGeocodingProvider()
        results = provider.search_locations("Chicago", limit=5)

        assert results == []
