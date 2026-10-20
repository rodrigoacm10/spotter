from datetime import datetime, timezone, timedelta
from unittest.mock import patch, MagicMock
import pytest
import requests

from routing.exceptions import WeatherProviderError
from routing.integrations.weather.open_meteo import (
    OpenMeteoWeatherProvider,
    parse_iso_hour,
    find_closest_hour_index,
)
from ..factories import CheckpointFactory


@pytest.mark.integration
class TestOpenMeteoIntegration:
    """Integration tests for Open-Meteo weather provider and hour alignment utilities."""

    def test_parse_iso_hour(self):
        """Verify ISO datetime string parser converts strings to UTC datetime or raises WeatherProviderError."""
        dt = parse_iso_hour("2026-10-18T10:00")
        assert dt.year == 2026
        assert dt.month == 10
        assert dt.day == 18
        assert dt.hour == 10
        assert dt.tzinfo == timezone.utc

        with pytest.raises(WeatherProviderError) as exc_info:
            parse_iso_hour("invalid-datetime")
        assert "invalid_timestamp" in exc_info.value.details

    def test_find_closest_hour_index(self):
        """Verify hour index search finds the timestamp closest to the target checkpoint ETA."""
        time_strings = [
            "2026-10-18T08:00",
            "2026-10-18T09:00",
            "2026-10-18T10:00",
            "2026-10-18T11:00"
        ]
        target_8_20 = datetime(2026, 10, 18, 8, 20, tzinfo=timezone.utc)
        assert find_closest_hour_index(target_8_20, time_strings) == 0

        target_9_45 = datetime(2026, 10, 18, 9, 45, tzinfo=timezone.utc)
        assert find_closest_hour_index(target_9_45, time_strings) == 2

        assert find_closest_hour_index(target_8_20, []) == 0

    def test_fetch_weather_empty_checkpoints(self):
        """Verify calling fetch_weather_for_checkpoints with an empty list immediately returns empty results."""
        provider = OpenMeteoWeatherProvider()
        assert provider.fetch_weather_for_checkpoints([]) == []

    @patch("requests.get")
    def test_fetch_weather_success(self, mock_get: MagicMock, departure_time):
        """Verify successful batch query of Open-Meteo forecast, ETA weather extraction, and 48h timeline construction."""
        mock_response = MagicMock()
        mock_response.status_code = 200

        times = [(departure_time + timedelta(hours=i)).strftime("%Y-%m-%dT%H:00") for i in range(48)]
        winds = [15.0 + (i * 0.2) for i in range(48)]
        rains = [0.1 if i == 5 else 0.0 for i in range(48)]
        snows = [0.0 for _ in range(48)]
        temps = [65.0 for _ in range(48)]

        mock_response.json.return_value = {
            "hourly": {
                "time": times,
                "wind_speed_10m": winds,
                "precipitation": rains,
                "snowfall": snows,
                "temperature_2m": temps
            }
        }
        mock_get.return_value = mock_response

        checkpoint = CheckpointFactory.build(index=0, mile=0.0, eta=departure_time)

        provider = OpenMeteoWeatherProvider()
        results = provider.fetch_weather_for_checkpoints([checkpoint])

        assert len(results) == 1
        res = results[0]
        assert res["checkpoint_index"] == 0
        assert res["eta_weather"]["wind_mph"] == 15.0
        assert res["eta_weather"]["rain_in_hr"] == 0.0
        assert len(res["hourly_timeline"]) == 48
        assert res["hourly_timeline"][0]["hour_offset"] == 0
        assert res["hourly_timeline"][5]["rain_in_hr"] == 0.1

    @patch("requests.get")
    def test_fetch_weather_network_fallback(self, mock_get: MagicMock, sample_checkpoint):
        """Verify that Open-Meteo network timeouts fall back safely to benign weather defaults (0 wind/rain/snow, 70F)."""
        mock_get.side_effect = requests.RequestException("Open-Meteo timeout")

        provider = OpenMeteoWeatherProvider()
        results = provider.fetch_weather_for_checkpoints([sample_checkpoint])

        assert len(results) == 1
        res = results[0]
        assert res["checkpoint_index"] == 0
        assert res["eta_weather"]["wind_mph"] == 0.0
        assert res["eta_weather"]["rain_in_hr"] == 0.0
        assert res["eta_weather"]["temperature"] == 70.0
        assert len(res["hourly_timeline"]) == 48
