from typing import Any
import pytest
from rest_framework.test import APIClient
from ..factories import RouteOptionFactory, AnalyzeTripPayloadFactory


@pytest.mark.e2e
@pytest.mark.django_db
class TestTripAnalysisE2E:
    """End-to-End scenario tests covering user flows and API contracts."""

    def test_complete_frontend_flow_geocode_to_route_recommendation(self, monkeypatch):
        """Verify the complete user journey from geocoding autocomplete to route analysis and safe route selection."""
        class MockE2EGeocoding:
            def search_locations(self, query: str, limit: int = 5):
                if "Chicago" in query:
                    return [{
                        "display_name": "Chicago, Cook County, Illinois, United States",
                        "latitude": 41.8781,
                        "longitude": -87.6298,
                        "type": "city"
                    }]
                return [{
                    "display_name": "Indianapolis, Marion County, Indiana, United States",
                    "latitude": 39.7684,
                    "longitude": -86.1581,
                    "type": "city"
                }]

        class MockE2ERouting:
            def get_routes(self, origin, destination, num_alternatives=3):
                return [
                    RouteOptionFactory.build(
                        id="route_1",
                        summary="Via I-65 S (Direct)",
                        distance_meters=290000.0,
                        distance_miles=180.0,
                        duration_seconds=10800.0,
                        duration_hours=3.0,
                        coordinates=[
                            [-87.6298, 41.8781],
                            [-86.8000, 40.8000],
                            [-86.1581, 39.7684]
                        ]
                    ),
                    RouteOptionFactory.build(
                        id="route_2",
                        summary="Via US-41 S & I-74 E",
                        distance_meters=330000.0,
                        distance_miles=205.0,
                        duration_seconds=12600.0,
                        duration_hours=3.5,
                        coordinates=[
                            [-87.6298, 41.8781],
                            [-87.4000, 40.5000],
                            [-86.1581, 39.7684]
                        ]
                    )
                ]

        class MockE2EWeather:
            def __init__(self):
                self.call_count = 0

            def fetch_weather_for_checkpoints(self, checkpoints, forecast_days=4):
                self.call_count += 1
                # First call is route_1 (danger route with severe wind triggering No Travel for heavy loads)
                # Second call is route_2 (safe route)
                is_danger_route = (self.call_count == 1)
                results = []
                for cp in checkpoints:
                    wind = 50.0 if is_danger_route else 15.0

                    timeline = [
                        {
                            "hour_offset": h,
                            "time": cp.eta.isoformat(),
                            "wind_mph": wind,
                            "rain_in_hr": 0.0,
                            "snow_in_hr": 0.0,
                            "temperature": 68.0
                        }
                        for h in range(48)
                    ]
                    results.append({
                        "checkpoint_index": cp.index,
                        "eta_weather": {
                            "forecast_time": cp.eta.isoformat(),
                            "wind_mph": wind,
                            "rain_in_hr": 0.0,
                            "snow_in_hr": 0.0,
                            "temperature": 68.0
                        },
                        "hourly_timeline": timeline
                    })
                return results

        monkeypatch.setattr("routing.services.geocoding.NominatimGeocodingProvider", MockE2EGeocoding)
        monkeypatch.setattr("routing.services.trip_analysis.OSRMRoutingProvider", MockE2ERouting)
        monkeypatch.setattr("routing.services.trip_analysis.OpenMeteoWeatherProvider", MockE2EWeather)

        client = APIClient()

        res_origin: Any = client.get("/api/geocode/?q=Chicago")
        assert res_origin.status_code == 200
        origin_data = res_origin.json()[0]
        assert origin_data["latitude"] == 41.8781
        assert origin_data["longitude"] == -87.6298

        res_dest: Any = client.get("/api/geocode/?q=Indianapolis")
        assert res_dest.status_code == 200
        dest_data = res_dest.json()[0]
        assert dest_data["latitude"] == 39.7684
        assert dest_data["longitude"] == -86.1581

        analyze_payload = AnalyzeTripPayloadFactory.build(
            origin_lat=origin_data["latitude"],
            origin_lon=origin_data["longitude"],
            dest_lat=dest_data["latitude"],
            dest_lon=dest_data["longitude"],
            departure_time="2026-10-18T08:00:00Z",
            load_weight_lbs=42000.0,
            sample_interval_miles=25.0
        )
        res_analyze: Any = client.post("/api/routes/analyze/", analyze_payload, format="json")
        assert res_analyze.status_code == 200
        data = res_analyze.json()

        assert "origin" in data
        assert "destination" in data
        assert "routes" in data
        assert len(data["routes"]) == 2

        # Route 2 should be recommended despite being longer, because Route 1 triggered No Travel
        recommended = next(r for r in data["routes"] if r["is_recommended"])
        assert recommended["id"] == "route_2"
        assert recommended["rank"] == 1
        assert recommended["metrics"]["has_no_travel"] is False

        non_recommended = next(r for r in data["routes"] if not r["is_recommended"])
        assert non_recommended["id"] == "route_1"
        assert non_recommended["rank"] == 2
        assert non_recommended["metrics"]["has_no_travel"] is True

        cp0 = recommended["checkpoints"][0]
        assert "mile" in cp0
        assert "latitude" in cp0
        assert "longitude" in cp0
        assert "eta" in cp0
        assert "weather" in cp0
        assert "risk" in cp0
        assert "hourly_timeline" in cp0
        assert len(cp0["hourly_timeline"]) == 48
