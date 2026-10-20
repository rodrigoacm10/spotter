import pytest
from datetime import datetime, timezone
from routing.domain.sampling import (
    haversine_miles,
    interpolate_coord,
    sample_route_checkpoints,
)
from ..factories import CheckpointFactory


@pytest.mark.unit
class TestSamplingUnit:
    """Unit tests for geographic calculations and route sampling logic."""

    def test_haversine_distance(self):
        """Verify that haversine distance returns 0 for identical points and computes accurate mile distances between cities."""
        assert haversine_miles(41.8781, -87.6298, 41.8781, -87.6298) == 0.0

        dist = haversine_miles(41.8781, -87.6298, 39.7684, -86.1581)
        assert 160.0 < dist < 170.0

    def test_interpolate_coord(self):
        """Verify linear interpolation produces exact coordinates for fractions 0.0, 0.5, and 1.0."""
        start = (10.0, 20.0)
        end = (20.0, 40.0)
        assert interpolate_coord(start, end, 0.0) == (10.0, 20.0)
        assert interpolate_coord(start, end, 0.5) == (15.0, 30.0)
        assert interpolate_coord(start, end, 1.0) == (20.0, 40.0)

    def test_sample_route_empty_coordinates(self, departure_time):
        """Verify that passing an empty list of coordinates returns an empty list of checkpoints."""
        checkpoints = sample_route_checkpoints(
            coordinates=[],
            departure_time=departure_time,
            total_duration_seconds=3600.0,
            interval_miles=25.0
        )
        assert checkpoints == []

    def test_sample_route_zero_distance(self, departure_time):
        """Verify that routes with zero total distance return a single origin checkpoint at mile 0."""
        coords = [[-87.6298, 41.8781], [-87.6298, 41.8781]]
        checkpoints = sample_route_checkpoints(
            coordinates=coords,
            departure_time=departure_time,
            total_duration_seconds=3600.0,
            interval_miles=25.0
        )
        assert len(checkpoints) == 1
        assert checkpoints[0].mile == 0.0
        assert checkpoints[0].index == 0

    def test_sample_route_checkpoints_normal_flow(self, departure_time, sample_coordinates):
        """Verify route sampling creates sequential checkpoints spaced by interval_miles with increasing ETAs."""
        checkpoints = sample_route_checkpoints(
            coordinates=sample_coordinates,
            departure_time=departure_time,
            total_duration_seconds=10800.0,
            interval_miles=50.0
        )

        assert len(checkpoints) >= 3
        assert checkpoints[0].index == 0
        assert checkpoints[0].mile == 0.0
        assert checkpoints[0].eta == departure_time

        for i in range(1, len(checkpoints)):
            assert checkpoints[i].mile > checkpoints[i - 1].mile
            assert checkpoints[i].eta > checkpoints[i - 1].eta

        assert checkpoints[-1].mile > 150.0

    def test_sample_route_with_zero_length_subsegment(self, departure_time):
        """Verify that segments containing duplicate consecutive coordinates are gracefully handled."""
        coords = [
            [-87.6298, 41.8781],
            [-86.8000, 40.8000],
            [-86.8000, 40.8000],
            [-86.1581, 39.7684],
        ]
        checkpoints = sample_route_checkpoints(
            coordinates=coords,
            departure_time=departure_time,
            total_duration_seconds=10800.0,
            interval_miles=25.0
        )
        assert len(checkpoints) >= 5
        assert checkpoints[0].mile == 0.0
        assert checkpoints[-1].mile > 150.0
