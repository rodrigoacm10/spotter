"""
API Request and Response Payload Factories.
Provides pre-configured payloads for HTTP tests against the Django REST Framework endpoints.
"""
from typing import Dict, Any


class AnalyzeTripPayloadFactory:
    """Factory for creating request payload dictionaries for the analyze endpoint."""

    @staticmethod
    def build(
        origin_lat: float = 41.8781,
        origin_lon: float = -87.6298,
        dest_lat: float = 39.7684,
        dest_lon: float = -86.1581,
        departure_time: str = "2026-10-18T08:00:00Z",
        load_weight_lbs: float = 42000.0,
        sample_interval_miles: float = 25.0,
    ) -> Dict[str, Any]:
        return {
            "origin_lat": origin_lat,
            "origin_lon": origin_lon,
            "dest_lat": dest_lat,
            "dest_lon": dest_lon,
            "departure_time": departure_time,
            "load_weight_lbs": load_weight_lbs,
            "sample_interval_miles": sample_interval_miles,
        }
