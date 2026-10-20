from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
import requests
import logging
from django.conf import settings
from ...domain.entities import Checkpoint
from ...exceptions import WeatherProviderError
from .base import BaseWeatherProvider

logger = logging.getLogger(__name__)

DEFAULT_OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
DEFAULT_OPEN_METEO_TIMEOUT = 15
DEFAULT_USER_AGENT = "SpotterTruckRoutingApp/1.0 (contact: info@spotter.ai)"


def parse_iso_hour(iso_str: str) -> datetime:
    try:
        dt = datetime.fromisoformat(iso_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception as e:
        logger.error(
            "Could not parse ISO hour timestamp '%s': %s",
            iso_str,
            e
        )
        raise WeatherProviderError(
            f"Invalid ISO datetime format from weather service: '{iso_str}'",
            details={"invalid_timestamp": iso_str}
        ) from e


def find_closest_hour_index(target_time: datetime, time_strings: List[str]) -> int:
    if not time_strings:
        return 0

    if target_time.tzinfo is None:
        target_time = target_time.replace(tzinfo=timezone.utc)

    best_index = 0
    best_difference = float("inf")

    for hour_index, time_string in enumerate(time_strings):
        try:
            time_datetime = parse_iso_hour(time_string)
        except WeatherProviderError:
            continue

        time_difference = abs((time_datetime - target_time).total_seconds())
        if time_difference < best_difference:
            best_difference = time_difference
            best_index = hour_index

    return best_index


class OpenMeteoWeatherProvider(BaseWeatherProvider):
    def __init__(
        self,
        base_url: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None,
        timeout: Optional[int] = None
    ):
        self.base_url = base_url or getattr(settings, "WEATHER_OPEN_METEO_URL", DEFAULT_OPEN_METEO_URL)
        default_ua = getattr(
            settings,
            "HTTP_USER_AGENT",
            getattr(settings, "GEOCODING_USER_AGENT", DEFAULT_USER_AGENT)
        )
        self.headers = headers or {"User-Agent": default_ua}
        self.timeout = timeout if timeout is not None else getattr(settings, "WEATHER_OPEN_METEO_TIMEOUT", DEFAULT_OPEN_METEO_TIMEOUT)

    def fetch_weather_for_checkpoints(
        self,
        checkpoints: List[Checkpoint],
        forecast_days: int = 4
    ) -> List[Dict[str, Any]]:
        if not checkpoints:
            return []

        departure_time = checkpoints[0].eta if checkpoints else datetime.now(timezone.utc)
        if departure_time.tzinfo is None:
            departure_time = departure_time.replace(tzinfo=timezone.utc)

        now = datetime.now(timezone.utc)
        days_needed = (max(departure_time, now) - now).days + 3
        actual_forecast_days = min(14, max(forecast_days, days_needed))

        lats_str = ",".join(f"{checkpoint.latitude:.4f}" for checkpoint in checkpoints)
        lons_str = ",".join(f"{checkpoint.longitude:.4f}" for checkpoint in checkpoints)

        params = {
            "latitude": lats_str,
            "longitude": lons_str,
            "hourly": "temperature_2m,precipitation,snowfall,wind_speed_10m",
            "wind_speed_unit": "mph",
            "precipitation_unit": "inch",
            "temperature_unit": "fahrenheit",
            "forecast_days": actual_forecast_days,
            "timezone": "UTC"
        }

        try:
            response = requests.get(self.base_url, params=params, headers=self.headers, timeout=self.timeout)
            response.raise_for_status()
            raw_data = response.json()
        except Exception as e:
            logger.error(f"Error fetching weather forecast from Open-Meteo: {e}")
            return [
                {
                    "checkpoint_index": checkpoint.index,
                    "eta_weather": {"wind_mph": 0.0, "rain_in_hr": 0.0, "snow_in_hr": 0.0, "temperature": 70.0},
                    "hourly_timeline": [
                        {
                            "hour_offset": h,
                            "time": (departure_time + timedelta(hours=h)).isoformat(),
                            "wind_mph": 0.0,
                            "rain_in_hr": 0.0,
                            "snow_in_hr": 0.0,
                            "temperature": 70.0,
                        }
                        for h in range(48)
                    ]
                }
                for checkpoint in checkpoints
            ]

        locations_data = raw_data if isinstance(raw_data, list) else [raw_data]

        results: List[Dict[str, Any]] = []

        for checkpoint_index, checkpoint in enumerate(checkpoints):
            location_data = (
                locations_data[checkpoint_index]
                if checkpoint_index < len(locations_data)
                else locations_data[-1]
            )
            hourly = location_data.get("hourly", {})
            times = hourly.get("time", [])
            winds = hourly.get("wind_speed_10m", [])
            rains = hourly.get("precipitation", [])
            snows = hourly.get("snowfall", [])
            temps = hourly.get("temperature_2m", [])

            closest_hour_index = find_closest_hour_index(checkpoint.eta, times)

            eta_wind = float(winds[closest_hour_index]) if closest_hour_index < len(winds) else 0.0
            eta_rain = float(rains[closest_hour_index]) if closest_hour_index < len(rains) else 0.0
            eta_snow = float(snows[closest_hour_index]) if closest_hour_index < len(snows) else 0.0
            eta_temp = float(temps[closest_hour_index]) if closest_hour_index < len(temps) else 70.0

            timeline = []
            for hour_offset in range(48):
                target_time = departure_time + timedelta(hours=hour_offset)
                hour_idx = find_closest_hour_index(target_time, times)

                timeline.append({
                    "hour_offset": hour_offset,
                    "time": times[hour_idx] if hour_idx < len(times) else target_time.isoformat(),
                    "wind_mph": float(winds[hour_idx]) if hour_idx < len(winds) else 0.0,
                    "rain_in_hr": float(rains[hour_idx]) if hour_idx < len(rains) else 0.0,
                    "snow_in_hr": float(snows[hour_idx]) if hour_idx < len(snows) else 0.0,
                    "temperature": float(temps[hour_idx]) if hour_idx < len(temps) else 70.0,
                })

            results.append({
                "checkpoint_index": checkpoint.index,
                "eta_weather": {
                    "forecast_time": (
                        times[closest_hour_index]
                        if closest_hour_index < len(times)
                        else checkpoint.eta.isoformat()
                    ),
                    "wind_mph": eta_wind,
                    "rain_in_hr": eta_rain,
                    "snow_in_hr": eta_snow,
                    "temperature": eta_temp
                },
                "hourly_timeline": timeline
            })

        return results
