from typing import List, Dict, Any, Optional
import requests
import logging
from django.conf import settings
from .base import BaseGeocodingProvider

logger = logging.getLogger(__name__)

DEFAULT_NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
DEFAULT_NOMINATIM_TIMEOUT = 6
DEFAULT_USER_AGENT = "SpotterTruckRoutingApp/1.0 (contact: info@spotter.ai)"


class NominatimGeocodingProvider(BaseGeocodingProvider):
    def __init__(
        self,
        base_url: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None,
        timeout: Optional[int] = None
    ):
        self.base_url = base_url or getattr(settings, "GEOCODING_NOMINATIM_URL", DEFAULT_NOMINATIM_URL)
        default_ua = getattr(
            settings,
            "HTTP_USER_AGENT",
            getattr(settings, "GEOCODING_USER_AGENT", DEFAULT_USER_AGENT)
        )
        self.headers = headers or {"User-Agent": default_ua}
        self.timeout = timeout if timeout is not None else getattr(settings, "GEOCODING_NOMINATIM_TIMEOUT", DEFAULT_NOMINATIM_TIMEOUT)

    def search_locations(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        if not query or len(query.strip()) < 2:
            return []

        params = {
            "q": query.strip(),
            "format": "json",
            "addressdetails": 1,
            "limit": limit,
        }

        try:
            response = requests.get(self.base_url, params=params, headers=self.headers, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            logger.warning(f"Error querying Nominatim: {e}")
            return []

        results = []
        for location_record in data:
            results.append({
                "display_name": location_record.get("display_name", ""),
                "latitude": float(location_record.get("lat", 0.0)),
                "longitude": float(location_record.get("lon", 0.0)),
                "type": location_record.get("type", ""),
            })

        return results
