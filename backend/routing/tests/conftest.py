import pytest
from datetime import datetime, timezone
from typing import List, Tuple, Dict, Any, Optional, Callable

from routing.domain.entities import RouteOption, Checkpoint
from routing.integrations.routing.base import BaseRoutingProvider
from routing.integrations.weather.base import BaseWeatherProvider
from routing.integrations.geocoding.base import BaseGeocodingProvider
from .factories import (
    CheckpointFactory,
    AnalyzedCheckpointFactory,
    AnalyzedRouteFactory,
    RouteOptionFactory,
)


@pytest.fixture
def departure_time():
    """Returns a standardized UTC departure time fixture."""
    return datetime(2026, 10, 18, 8, 0, tzinfo=timezone.utc)


@pytest.fixture
def sample_coordinates():
    """Returns coordinates in GeoJSON format [lon, lat] for Chicago to Indianapolis."""
    return [
        [-87.6298, 41.8781],
        [-86.8000, 40.8000],
        [-86.1581, 39.7684],
    ]


@pytest.fixture
def sample_route_option(sample_coordinates):
    """Returns a standardized RouteOption domain entity using RouteOptionFactory."""
    return RouteOptionFactory.build(coordinates=sample_coordinates)


@pytest.fixture
def sample_checkpoint(departure_time):
    """Returns a sample Checkpoint instance using CheckpointFactory."""
    return CheckpointFactory.build(eta=departure_time)


@pytest.fixture
def sample_analyzed_checkpoint(sample_checkpoint):
    """Returns a sample AnalyzedCheckpoint instance using AnalyzedCheckpointFactory."""
    return AnalyzedCheckpointFactory.build(checkpoint=sample_checkpoint)


@pytest.fixture
def sample_analyzed_route(sample_analyzed_checkpoint, sample_coordinates):
    """Returns a sample AnalyzedRoute entity using AnalyzedRouteFactory."""
    return AnalyzedRouteFactory.build(
        checkpoints=[sample_analyzed_checkpoint],
        geometry={"type": "LineString", "coordinates": sample_coordinates}
    )


class MockRoutingProvider(BaseRoutingProvider):
    """Mock routing provider returning preset or default RouteOption items."""

    def __init__(self, routes: Optional[List[RouteOption]] = None):
        self._routes: Optional[List[RouteOption]] = routes

    def get_routes(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        num_alternatives: int = 3
    ) -> List[RouteOption]:
        if self._routes is not None:
            return self._routes
        return [RouteOptionFactory.build()]


class MockWeatherProvider(BaseWeatherProvider):
    """Mock weather provider returning predictable forecast and timelines."""

    def __init__(
        self,
        weather_data_generator: Optional[Callable[[List[Checkpoint]], List[Dict[str, Any]]]] = None
    ):
        self._generator: Optional[Callable[[List[Checkpoint]], List[Dict[str, Any]]]] = weather_data_generator

    def fetch_weather_for_checkpoints(
        self,
        checkpoints: List[Checkpoint],
        forecast_days: int = 4
    ) -> List[Dict[str, Any]]:
        if self._generator is not None:
            return self._generator(checkpoints)
        return [
            {
                "checkpoint_index": checkpoint.index,
                "eta_weather": {
                    "forecast_time": checkpoint.eta.isoformat(),
                    "wind_mph": 12.0,
                    "rain_in_hr": 0.0,
                    "snow_in_hr": 0.0,
                    "temperature": 68.0
                },
                "hourly_timeline": []
            }
            for checkpoint in checkpoints
        ]


class MockGeocodingProvider(BaseGeocodingProvider):
    """Mock geocoding provider for autocomplete tests."""

    def __init__(self, results: Optional[List[Dict[str, Any]]] = None):
        self._results: List[Dict[str, Any]] = results if results is not None else [
            {
                "display_name": "Chicago, Cook County, Illinois, United States",
                "latitude": 41.8781,
                "longitude": -87.6298,
                "type": "city"
            }
        ]

    def search_locations(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        if not query or len(query.strip()) < 2:
            return []
        return self._results[:limit]


@pytest.fixture
def mock_routing_provider():
    """Fixture providing a mock routing provider."""
    return MockRoutingProvider()


@pytest.fixture
def mock_weather_provider():
    """Fixture providing a mock weather provider."""
    return MockWeatherProvider()


@pytest.fixture
def mock_geocoding_provider():
    """Fixture providing a mock geocoding provider."""
    return MockGeocodingProvider()
