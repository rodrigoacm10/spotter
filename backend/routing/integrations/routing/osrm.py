from typing import List, Tuple, Dict, Any, Optional, cast
import requests
import logging
from django.conf import settings
from ...domain.entities import RouteOption
from ...exceptions import RoutingProviderError, NoRouteFoundError
from .base import BaseRoutingProvider

logger = logging.getLogger(__name__)

METERS_TO_MILES = 0.000621371

DEFAULT_OSRM_URL = "https://router.project-osrm.org"
DEFAULT_FALLBACK_URL = "https://routing.openstreetmap.de/routed-car"
DEFAULT_OSRM_TIMEOUT = 12
DEFAULT_USER_AGENT = "SpotterTruckRoutingApp/1.0 (contact: info@spotter.ai)"

# Lateral and longitudinal offset scales used to synthesize candidate waypoints
# when OSRM returns fewer alternative corridors than requested.
WAYPOINT_OFFSET_SCALES = [
    (0.08, 0.08),
    (-0.08, -0.08),
    (0.15, -0.15),
    (-0.15, 0.15),
    (0.20, -0.10),
    (-0.10, 0.20),
    (0.25, 0.25),
    (-0.25, -0.25),
]


class OSRMRoutingProvider(BaseRoutingProvider):
    def __init__(
        self,
        base_url: Optional[str] = None,
        endpoints: Optional[List[str]] = None,
        headers: Optional[Dict[str, str]] = None,
        timeout: Optional[int] = None,
    ):
        primary = base_url or getattr(settings, "ROUTING_OSRM_URL", DEFAULT_OSRM_URL)
        default_ua = getattr(
            settings,
            "HTTP_USER_AGENT",
            getattr(settings, "GEOCODING_USER_AGENT", DEFAULT_USER_AGENT)
        )
        self.headers = headers or {"User-Agent": default_ua}
        self.timeout = timeout if timeout is not None else getattr(settings, "ROUTING_OSRM_TIMEOUT", DEFAULT_OSRM_TIMEOUT)

        if endpoints:
            self.endpoints = [ep.rstrip("/") for ep in endpoints]
        else:
            self.endpoints = [primary.rstrip("/")]
            if DEFAULT_FALLBACK_URL not in self.endpoints:
                self.endpoints.append(DEFAULT_FALLBACK_URL)

    def _fetch_from_osrm(self, path: str, params: Dict[str, Any]) -> Dict[str, Any]:
        last_error = None
        for endpoint in self.endpoints:
            url = f"{endpoint}{path}"
            try:
                response = requests.get(url, params=params, headers=self.headers, timeout=self.timeout)
                if response.status_code == 200:
                    data: Any = response.json()
                    if isinstance(data, dict):
                        if data.get("code") in ("Ok", "NoRoute"):
                            return cast(Dict[str, Any], data)
                        last_error = f"OSRM returned error code '{data.get('code')}': {data.get('message', '')}"
                else:
                    last_error = f"HTTP {response.status_code} from {endpoint}: {response.text[:200]}"
                    logger.warning(f"Endpoint {endpoint} returned status {response.status_code}. Trying fallback mirror...")
            except requests.RequestException as e:
                last_error = e
                logger.warning(f"Connection failed for {endpoint}: {e}. Trying fallback mirror...")

        if last_error:
            raise RoutingProviderError(
                f"Failed to fetch routes from OSRM across all endpoints: {str(last_error)}",
                details={"endpoints": self.endpoints, "last_error": str(last_error)}
            )
        return {}

    def _synthesize_alternative_routes(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        existing_routes: List[Dict[str, Any]],
        target_count: int,
    ) -> List[Dict[str, Any]]:
        orig_lat, orig_lon = origin
        dest_lat, dest_lon = destination
        routes_data = list(existing_routes)

        scale_idx = 0
        while len(routes_data) < target_count and scale_idx < len(WAYPOINT_OFFSET_SCALES):
            s_lat, s_lon = WAYPOINT_OFFSET_SCALES[scale_idx]
            scale_idx += 1

            mid_lat = (orig_lat + dest_lat) / 2
            mid_lon = (orig_lon + dest_lon) / 2
            d_lat = dest_lat - orig_lat
            d_lon = dest_lon - orig_lon

            offset_lat = mid_lat - (d_lon * s_lat)
            offset_lon = mid_lon + (d_lat * s_lon)

            try:
                via_path = f"/route/v1/driving/{orig_lon},{orig_lat};{offset_lon},{offset_lat};{dest_lon},{dest_lat}"
                via_data = self._fetch_from_osrm(
                    via_path,
                    params={"overview": "full", "geometries": "geojson", "steps": "false"}
                )
                if via_data and via_data.get("code") == "Ok" and via_data.get("routes"):
                    candidate_route = via_data["routes"][0]
                    cand_dist = float(candidate_route.get("distance", 0))
                    if not any(abs(float(r.get("distance", 0)) - cand_dist) < 80 for r in routes_data):
                        routes_data.append(candidate_route)
            except Exception as e:
                logger.warning(f"Alternative route attempt with waypoint offset ({s_lat}, {s_lon}) failed: {e}")

        return routes_data

    def get_routes(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        num_alternatives: int = 3
    ) -> List[RouteOption]:
        orig_lat, orig_lon = origin
        dest_lat, dest_lon = destination

        route_path = f"/route/v1/driving/{orig_lon},{orig_lat};{dest_lon},{dest_lat}"
        params = {
            "overview": "full",
            "geometries": "geojson",
            "alternatives": str(num_alternatives) if num_alternatives > 1 else "false",
            "steps": "false",
        }

        data = self._fetch_from_osrm(route_path, params)
        if not data or data.get("code") == "NoRoute" or not data.get("routes"):
            raise NoRouteFoundError("OSRM could not find valid routes between requested coordinates.")

        routes_data = data.get("routes", [])

        if len(routes_data) < num_alternatives:
            routes_data = self._synthesize_alternative_routes(
                origin=origin,
                destination=destination,
                existing_routes=routes_data,
                target_count=num_alternatives
            )

        result: List[RouteOption] = []
        for route_index, route_data in enumerate(routes_data):
            distance_meters = float(route_data.get("distance", 0.0))
            duration_seconds = float(route_data.get("duration", 0.0))
            geometry = route_data.get("geometry", {})
            summary = route_data.get("legs", [{}])[0].get("summary", f"Route {route_index + 1}")
            if not summary:
                summary = f"Option {route_index + 1}"

            result.append(
                RouteOption(
                    id=f"route_{route_index + 1}",
                    summary=summary,
                    distance_meters=round(distance_meters, 2),
                    distance_miles=round(distance_meters * METERS_TO_MILES, 2),
                    duration_seconds=round(duration_seconds, 2),
                    duration_hours=round(duration_seconds / 3600.0, 2),
                    geometry=geometry
                )
            )

        return result
