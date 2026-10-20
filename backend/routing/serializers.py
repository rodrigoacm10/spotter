from dataclasses import dataclass
from typing import Tuple
from rest_framework import serializers
from django.utils import timezone


@dataclass(frozen=True)
class TripRequest:
    origin: Tuple[float, float]
    destination: Tuple[float, float]
    departure_time: timezone.datetime
    load_weight_lbs: float
    sample_interval_miles: float


class AnalyzeTripSerializer(serializers.Serializer):
    origin_lat = serializers.FloatField(required=True, min_value=-90.0, max_value=90.0)
    origin_lon = serializers.FloatField(required=True, min_value=-180.0, max_value=180.0)
    dest_lat = serializers.FloatField(required=True, min_value=-90.0, max_value=90.0)
    dest_lon = serializers.FloatField(required=True, min_value=-180.0, max_value=180.0)
    departure_time = serializers.DateTimeField(required=False, default=timezone.now)
    load_weight_lbs = serializers.FloatField(
        required=False,
        default=35000.0,
        min_value=0.0,
        max_value=120000.0
    )
    sample_interval_miles = serializers.FloatField(
        required=False,
        default=25.0
    )

    def validate_sample_interval_miles(self, value):
        if value not in [10.0, 25.0, 50.0, 10, 25, 50]:
            raise serializers.ValidationError("sample_interval_miles must be 10, 25, or 50.")
        return float(value)

    def validate(self, attrs):
        orig = (attrs.get("origin_lat"), attrs.get("origin_lon"))
        dest = (attrs.get("dest_lat"), attrs.get("dest_lon"))
        if orig[0] is not None and orig == dest:
            raise serializers.ValidationError(
                {"dest_lat": "Origin and destination coordinates must be different."}
            )
        return attrs

    def to_trip_request(self) -> TripRequest:
        return TripRequest(
            origin=(self.validated_data["origin_lat"], self.validated_data["origin_lon"]),
            destination=(self.validated_data["dest_lat"], self.validated_data["dest_lon"]),
            departure_time=self.validated_data["departure_time"],
            load_weight_lbs=float(self.validated_data["load_weight_lbs"]),
            sample_interval_miles=float(self.validated_data["sample_interval_miles"]),
        )


class GeocodeSerializer(serializers.Serializer):
    q = serializers.CharField(required=True, min_length=2, max_length=200)
    limit = serializers.IntegerField(required=False, default=5, min_value=1, max_value=10)


class LocationOptionResponseSerializer(serializers.Serializer):
    display_name = serializers.CharField()
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    type = serializers.CharField(required=False, allow_blank=True)


class CheckpointWeatherResponseSerializer(serializers.Serializer):
    forecast_time = serializers.CharField(required=False)
    wind_mph = serializers.FloatField()
    rain_in_hr = serializers.FloatField()
    snow_in_hr = serializers.FloatField()
    temperature = serializers.FloatField()


class CheckpointRiskResponseSerializer(serializers.Serializer):
    overall_risk = serializers.CharField()
    overall_risk_value = serializers.IntegerField()
    color = serializers.CharField()
    wind_risk = serializers.CharField()
    rain_risk = serializers.CharField()
    snow_risk = serializers.CharField()
    wind_mph = serializers.FloatField()
    rain_in_hr = serializers.FloatField()
    snow_in_hr = serializers.FloatField()
    reasons = serializers.ListField(child=serializers.CharField())


class HourlyTimelineItemSerializer(serializers.Serializer):
    hour_offset = serializers.IntegerField()
    time = serializers.CharField()
    wind_mph = serializers.FloatField()
    rain_in_hr = serializers.FloatField()
    snow_in_hr = serializers.FloatField()
    temperature = serializers.FloatField()


class CheckpointResponseSerializer(serializers.Serializer):
    index = serializers.IntegerField()
    mile = serializers.FloatField()
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    eta = serializers.CharField()
    weather = CheckpointWeatherResponseSerializer()
    risk = CheckpointRiskResponseSerializer()
    hourly_timeline = serializers.ListField(child=HourlyTimelineItemSerializer())


class RouteMetricsResponseSerializer(serializers.Serializer):
    low_miles = serializers.FloatField()
    moderate_miles = serializers.FloatField()
    high_miles = serializers.FloatField()
    severe_miles = serializers.FloatField()
    no_travel_miles = serializers.FloatField()
    average_risk_score = serializers.FloatField()
    has_no_travel = serializers.BooleanField()
    total_checkpoints = serializers.IntegerField()


class AnalyzedRouteResponseSerializer(serializers.Serializer):
    id = serializers.CharField()
    summary = serializers.CharField()
    distance_miles = serializers.FloatField()
    duration_hours = serializers.FloatField()
    duration_seconds = serializers.FloatField()
    geometry = serializers.DictField()
    checkpoints = serializers.ListField(child=CheckpointResponseSerializer())
    metrics = RouteMetricsResponseSerializer()
    is_recommended = serializers.BooleanField()
    rank = serializers.IntegerField()
    recommendation_reason = serializers.CharField(allow_null=True)


class CoordinateResponseSerializer(serializers.Serializer):
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()


class TripAnalysisResponseSerializer(serializers.Serializer):
    origin = CoordinateResponseSerializer()
    destination = CoordinateResponseSerializer()
    departure_time = serializers.CharField()
    load_weight_lbs = serializers.FloatField()
    sample_interval_miles = serializers.FloatField()
    routes = serializers.ListField(child=AnalyzedRouteResponseSerializer())


class ErrorResponseSerializer(serializers.Serializer):
    code = serializers.CharField()
    message = serializers.CharField()
    details = serializers.DictField()
