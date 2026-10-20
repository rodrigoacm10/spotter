import pytest
from routing.serializers import AnalyzeTripSerializer, GeocodeSerializer
from ..factories import AnalyzeTripPayloadFactory


@pytest.mark.unit
class TestSerializersUnit:
    """Unit tests for request serializers and input validators."""

    def test_analyze_trip_serializer_valid(self):
        """Verify AnalyzeTripSerializer accepts a valid payload with complete trip and vehicle parameters."""
        payload = AnalyzeTripPayloadFactory.build()
        serializer = AnalyzeTripSerializer(data=payload)
        assert serializer.is_valid(), serializer.errors
        assert serializer.validated_data["sample_interval_miles"] == 25.0
        assert serializer.validated_data["load_weight_lbs"] == 42000.0

    def test_analyze_trip_serializer_defaults(self):
        """Verify AnalyzeTripSerializer applies default values for departure time, weight (35,000 lbs), and interval (25 miles)."""
        payload = {
            "origin_lat": 41.8781,
            "origin_lon": -87.6298,
            "dest_lat": 39.7684,
            "dest_lon": -86.1581,
        }
        serializer = AnalyzeTripSerializer(data=payload)
        assert serializer.is_valid(), serializer.errors
        assert serializer.validated_data["load_weight_lbs"] == 35000.0
        assert serializer.validated_data["sample_interval_miles"] == 25.0
        assert "departure_time" in serializer.validated_data

    @pytest.mark.parametrize("interval", [10, 25, 50, 10.0, 25.0, 50.0])
    def test_analyze_trip_serializer_allowed_intervals(self, interval):
        """Verify AnalyzeTripSerializer accepts allowed sampling intervals of 10, 25, and 50 miles."""
        payload = AnalyzeTripPayloadFactory.build(sample_interval_miles=interval)
        serializer = AnalyzeTripSerializer(data=payload)
        assert serializer.is_valid()
        assert serializer.validated_data["sample_interval_miles"] == float(interval)

    @pytest.mark.parametrize("invalid_interval", [5.0, 15.0, 30.0, 100.0])
    def test_analyze_trip_serializer_invalid_interval(self, invalid_interval):
        """Verify AnalyzeTripSerializer rejects non-standard sampling intervals with a validation error."""
        payload = AnalyzeTripPayloadFactory.build(sample_interval_miles=invalid_interval)
        serializer = AnalyzeTripSerializer(data=payload)
        assert not serializer.is_valid()
        assert "sample_interval_miles" in serializer.errors
        assert "must be 10, 25, or 50" in str(serializer.errors["sample_interval_miles"])

    def test_analyze_trip_serializer_negative_load_weight(self):
        """Verify AnalyzeTripSerializer rejects negative load weight values."""
        payload = AnalyzeTripPayloadFactory.build(load_weight_lbs=-100.0)
        serializer = AnalyzeTripSerializer(data=payload)
        assert not serializer.is_valid()
        assert "load_weight_lbs" in serializer.errors

    def test_analyze_trip_serializer_missing_required_fields(self):
        """Verify AnalyzeTripSerializer fails validation when mandatory coordinate fields are omitted."""
        serializer = AnalyzeTripSerializer(data={})
        assert not serializer.is_valid()
        assert "origin_lat" in serializer.errors
        assert "origin_lon" in serializer.errors
        assert "dest_lat" in serializer.errors
        assert "dest_lon" in serializer.errors

    def test_geocode_serializer_valid(self):
        """Verify GeocodeSerializer accepts valid location search queries and custom limits."""
        serializer = GeocodeSerializer(data={"q": "Indianapolis", "limit": 3})
        assert serializer.is_valid()
        assert serializer.validated_data["q"] == "Indianapolis"
        assert serializer.validated_data["limit"] == 3

    def test_geocode_serializer_default_limit(self):
        """Verify GeocodeSerializer defaults to a limit of 5 suggestions when limit is omitted."""
        serializer = GeocodeSerializer(data={"q": "Dallas"})
        assert serializer.is_valid()
        assert serializer.validated_data["limit"] == 5

    def test_geocode_serializer_min_length(self):
        """Verify GeocodeSerializer enforces minimum search string length of 2 characters."""
        serializer = GeocodeSerializer(data={"q": "a"})
        assert not serializer.is_valid()
        assert "q" in serializer.errors

    def test_geocode_serializer_limit_boundaries(self):
        """Verify GeocodeSerializer validates limit bounds between 1 and 10."""
        s_low = GeocodeSerializer(data={"q": "Miami", "limit": 0})
        assert not s_low.is_valid()
        assert "limit" in s_low.errors

        s_high = GeocodeSerializer(data={"q": "Miami", "limit": 11})
        assert not s_high.is_valid()
        assert "limit" in s_high.errors

    def test_analyze_trip_same_origin_and_destination_rejected(self):
        """Verify AnalyzeTripSerializer rejects identical origin and destination coordinates."""
        payload = AnalyzeTripPayloadFactory.build(
            origin_lat=41.8781,
            origin_lon=-87.6298,
            dest_lat=41.8781,
            dest_lon=-87.6298,
        )
        serializer = AnalyzeTripSerializer(data=payload)
        assert not serializer.is_valid()
        assert "dest_lat" in serializer.errors

    def test_analyze_trip_coordinate_bounds(self):
        """Verify AnalyzeTripSerializer enforces lat [-90, 90] and lon [-180, 180]."""
        payload = AnalyzeTripPayloadFactory.build(origin_lat=95.0, origin_lon=200.0)
        serializer = AnalyzeTripSerializer(data=payload)
        assert not serializer.is_valid()
        assert "origin_lat" in serializer.errors
        assert "origin_lon" in serializer.errors

    def test_analyze_trip_load_weight_upper_bound(self):
        """Verify AnalyzeTripSerializer enforces max cargo weight limit of 120,000 lbs."""
        payload = AnalyzeTripPayloadFactory.build(load_weight_lbs=150000.0)
        serializer = AnalyzeTripSerializer(data=payload)
        assert not serializer.is_valid()
        assert "load_weight_lbs" in serializer.errors

    def test_to_trip_request_dataclass(self):
        """Verify to_trip_request returns a typed TripRequest dataclass."""
        payload = AnalyzeTripPayloadFactory.build()
        serializer = AnalyzeTripSerializer(data=payload)
        assert serializer.is_valid()
        trip_req = serializer.to_trip_request()
        assert trip_req.origin == (payload["origin_lat"], payload["origin_lon"])
        assert trip_req.destination == (payload["dest_lat"], payload["dest_lon"])
        assert trip_req.load_weight_lbs == float(payload["load_weight_lbs"])
        assert trip_req.sample_interval_miles == float(payload["sample_interval_miles"])
