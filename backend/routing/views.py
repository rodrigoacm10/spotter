import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from .serializers import (
    AnalyzeTripSerializer,
    GeocodeSerializer,
    TripAnalysisResponseSerializer,
    LocationOptionResponseSerializer,
    ErrorResponseSerializer,
)
from .services import analyze_trip, search_locations
from .exceptions import SpotterBaseException

logger = logging.getLogger(__name__)


class HealthCheckView(APIView):
    @extend_schema(
        tags=["System"],
        summary="Backend health check",
        description="Verifies that the backend service is up and operational.",
        responses={200: OpenApiTypes.OBJECT}
    )
    def get(self, request):
        return Response({"status": "ok", "service": "spotter-backend"})


class GeocodeView(APIView):
    @extend_schema(
        tags=["Geocoding"],
        summary="Location autocomplete and search",
        description="Searches cities and places via Nominatim/OpenStreetMap for origin and destination input fields.",
        parameters=[
            OpenApiParameter(
                name="q",
                type=str,
                location=OpenApiParameter.QUERY,
                required=True,
                description="Search query text (e.g., 'Chicago' or 'Dallas, TX')"
            ),
            OpenApiParameter(
                name="limit",
                type=int,
                location=OpenApiParameter.QUERY,
                required=False,
                description="Maximum number of location suggestions (default: 5)"
            )
        ],
        responses={
            200: LocationOptionResponseSerializer(many=True),
            400: ErrorResponseSerializer,
            500: ErrorResponseSerializer,
        }
    )
    def get(self, request):
        serializer = GeocodeSerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        query_text = serializer.validated_data["q"]
        limit = serializer.validated_data["limit"]

        results = search_locations(query=query_text, limit=limit)
        return Response(results, status=status.HTTP_200_OK)


class AnalyzeTripView(APIView):
    @extend_schema(
        tags=["Routing & Weather"],
        summary="Complete trip analysis and route recommendation",
        description=(
            "Accepts origin, destination, departure datetime, cargo load weight (lbs), and sampling interval. "
            "Generates 3 alternative routes, samples route checkpoints with precise ETAs, queries hourly weather "
            "forecasts from Open-Meteo, evaluates weather risks factoring in truck cargo weight, and selects the recommended route."
        ),
        request=AnalyzeTripSerializer,
        examples=[
            OpenApiExample(
                "Example Chicago -> Indianapolis with 42,000 lbs cargo",
                value={
                    "origin_lat": 41.8781,
                    "origin_lon": -87.6298,
                    "dest_lat": 39.7684,
                    "dest_lon": -86.1581,
                    "departure_time": "2026-10-18T08:00:00Z",
                    "load_weight_lbs": 42000.0,
                    "sample_interval_miles": 25.0
                },
                request_only=True
            )
        ],
        responses={
            200: TripAnalysisResponseSerializer,
            400: ErrorResponseSerializer,
            500: ErrorResponseSerializer,
            502: ErrorResponseSerializer,
            504: ErrorResponseSerializer,
        }
    )
    def post(self, request):
        serializer = AnalyzeTripSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        trip_req = serializer.to_trip_request()

        result = analyze_trip(
            origin=trip_req.origin,
            destination=trip_req.destination,
            departure_time=trip_req.departure_time,
            load_weight_lbs=trip_req.load_weight_lbs,
            sample_interval_miles=trip_req.sample_interval_miles
        )
        return Response(result.to_dict(), status=status.HTTP_200_OK)
