import pytest
from datetime import datetime, timezone
from routing.services import search_locations, analyze_trip
from ..factories import RouteOptionFactory


@pytest.mark.unit
class TestServicesUnit:
    """Unit tests for domain application services."""

    def test_search_locations_with_custom_provider(self, mock_geocoding_provider):
        """Verify search_locations delegates query and limit to the injected custom geocoding provider."""
        results = search_locations(query="Chicago", limit=2, provider=mock_geocoding_provider)
        assert len(results) == 1
        assert results[0]["display_name"] == "Chicago, Cook County, Illinois, United States"

    def test_search_locations_with_default_provider(self, monkeypatch):
        """Verify search_locations instantiates default Nominatim provider when provider is not passed."""
        class DummyProvider:
            def search_locations(self, query, limit=5):
                return [{"display_name": "Test City", "latitude": 10.0, "longitude": 20.0}]

        monkeypatch.setattr("routing.services.geocoding.NominatimGeocodingProvider", DummyProvider)
        results = search_locations(query="Test City")
        assert len(results) == 1
        assert results[0]["display_name"] == "Test City"

    def test_analyze_trip_orchestration(self, departure_time, mock_routing_provider, mock_weather_provider):
        """Verify analyze_trip orchestrates route generation, checkpoint sampling, weather lookup, and risk evaluation."""
        result = analyze_trip(
            origin=(41.8781, -87.6298),
            destination=(39.7684, -86.1581),
            departure_time=departure_time,
            load_weight_lbs=42000.0,
            sample_interval_miles=50.0,
            routing_provider=mock_routing_provider,
            weather_provider=mock_weather_provider
        )

        assert "routes" in result
        assert len(result["routes"]) == 1
        route = result["routes"][0]
        assert route["is_recommended"] is True
        assert route["metrics"]["has_no_travel"] is False
        assert len(route["checkpoints"]) > 0

    def test_analyze_trip_with_default_providers(self, monkeypatch, departure_time, mock_routing_provider, mock_weather_provider):
        """Verify analyze_trip uses default OSRM and Open-Meteo providers when none are provided."""
        monkeypatch.setattr("routing.services.trip_analysis.OSRMRoutingProvider", lambda: mock_routing_provider)
        monkeypatch.setattr("routing.services.trip_analysis.OpenMeteoWeatherProvider", lambda: mock_weather_provider)

        result = analyze_trip(
            origin=(41.8781, -87.6298),
            destination=(39.7684, -86.1581),
            departure_time=departure_time,
            load_weight_lbs=35000.0
        )
        assert len(result["routes"]) == 1
        assert result["routes"][0]["is_recommended"] is True

    def test_analyze_trip_parallel_multiple_routes(self, departure_time, mock_weather_provider):
        """Verify analyze_trip analyzes multiple routes concurrently and preserves ranked ordering."""
        from ..conftest import MockRoutingProvider
        route1 = RouteOptionFactory.build(id="route_1", summary="Route 1", duration_seconds=10000.0)
        route2 = RouteOptionFactory.build(id="route_2", summary="Route 2", duration_seconds=12000.0)
        route3 = RouteOptionFactory.build(id="route_3", summary="Route 3", duration_seconds=14000.0)

        multi_router = MockRoutingProvider(routes=[route1, route2, route3])

        result = analyze_trip(
            origin=(41.8781, -87.6298),
            destination=(39.7684, -86.1581),
            departure_time=departure_time,
            load_weight_lbs=40000.0,
            sample_interval_miles=50.0,
            routing_provider=multi_router,
            weather_provider=mock_weather_provider,
        )

        assert len(result.routes) == 3
        assert result.routes[0].is_recommended is True
        assert result.routes[0].rank == 1
        assert result.routes[1].rank == 2
        assert result.routes[2].rank == 3

    def test_analyze_trip_parallel_exception_propagation(self, departure_time):
        """Verify exceptions in thread worker are cleanly propagated to caller."""
        from ..conftest import MockRoutingProvider, MockWeatherProvider
        from routing.exceptions import WeatherProviderError

        route1 = RouteOptionFactory.build(id="route_1")
        route2 = RouteOptionFactory.build(id="route_2")
        multi_router = MockRoutingProvider(routes=[route1, route2])

        def failing_weather(_checkpoints):
            raise WeatherProviderError("Weather API connection timed out")

        failing_weather_provider = MockWeatherProvider(weather_data_generator=failing_weather)

        with pytest.raises(WeatherProviderError, match="Weather API connection timed out"):
            analyze_trip(
                origin=(41.8781, -87.6298),
                destination=(39.7684, -86.1581),
                departure_time=departure_time,
                load_weight_lbs=40000.0,
                routing_provider=multi_router,
                weather_provider=failing_weather_provider,
            )
