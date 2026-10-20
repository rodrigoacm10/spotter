import pytest
from rest_framework import status
from rest_framework.exceptions import ValidationError
from routing.exceptions import (
    SpotterBaseException,
    ProviderError,
    RoutingProviderError,
    WeatherProviderError,
    GeocodingProviderError,
    NoRouteFoundError,
    ProviderTimeoutError,
    custom_exception_handler,
)


@pytest.mark.unit
class TestExceptionsUnit:
    """Unit tests for domain exceptions and standardized DRF exception handler."""

    def test_spotter_base_exception_defaults(self):
        exc = SpotterBaseException()
        assert exc.code == "spotter_error"
        assert exc.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert exc.details == {}

    def test_provider_exceptions(self):
        routing_exc = RoutingProviderError(message="OSRM mirror down")
        assert routing_exc.provider == "OSRM"
        assert routing_exc.code == "routing_provider_error"
        assert routing_exc.status_code == status.HTTP_502_BAD_GATEWAY
        assert routing_exc.details["provider"] == "OSRM"

        weather_exc = WeatherProviderError(message="Open-Meteo down")
        assert weather_exc.provider == "Open-Meteo"
        assert weather_exc.code == "weather_provider_error"
        assert weather_exc.status_code == status.HTTP_502_BAD_GATEWAY

        geocoding_exc = GeocodingProviderError(message="Nominatim down")
        assert geocoding_exc.provider == "Nominatim"
        assert geocoding_exc.code == "geocoding_provider_error"
        assert geocoding_exc.status_code == status.HTTP_502_BAD_GATEWAY

        timeout_exc = ProviderTimeoutError(provider="OSRM")
        assert timeout_exc.code == "provider_timeout"
        assert timeout_exc.status_code == status.HTTP_504_GATEWAY_TIMEOUT

        no_route_exc = NoRouteFoundError()
        assert no_route_exc.code == "no_route_found"
        assert no_route_exc.status_code == status.HTTP_404_NOT_FOUND

    def test_custom_exception_handler_spotter_exception(self):
        exc = RoutingProviderError("OSRM unreachable", details={"retry": False})
        response = custom_exception_handler(exc, {})
        assert response.status_code == 502
        data = response.data
        assert data["code"] == "routing_provider_error"
        assert data["message"] == "OSRM unreachable"
        assert data["details"]["provider"] == "OSRM"
        assert data["details"]["retry"] is False

    def test_custom_exception_handler_drf_validation_error(self):
        drf_exc = ValidationError({"origin_lat": ["A valid number is required."]})
        response = custom_exception_handler(drf_exc, {})
        assert response.status_code == 400
        data = response.data
        assert data["code"] == "validation_error"
        assert data["message"] == "Invalid request parameters."
        assert "origin_lat" in data["details"]

    def test_custom_exception_handler_unhandled_exception(self):
        raw_exc = KeyError("secret_key_missing")
        response = custom_exception_handler(raw_exc, {})
        assert response.status_code == 500
        data = response.data
        assert data["code"] == "internal_server_error"
        assert "unexpected server error" in data["message"].lower()
        # Ensure raw internal details are NOT leaked to the client
        assert "secret_key_missing" not in str(data)
