from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from typing import Tuple, Dict, Any, List, Optional
import logging

from ..domain.entities import (
    Checkpoint,
    RouteOption,
    AnalyzedCheckpoint,
    RouteRiskMetrics,
    AnalyzedRoute,
    TripAnalysis,
)
from ..domain.sampling import sample_route_checkpoints
from ..domain.risk import evaluate_checkpoint_risk
from ..domain.recommend import RouteRanker
from ..integrations.routing import BaseRoutingProvider, OSRMRoutingProvider
from ..integrations.weather import BaseWeatherProvider, OpenMeteoWeatherProvider

logger = logging.getLogger(__name__)


def get_routing_provider(provider: Optional[BaseRoutingProvider] = None) -> BaseRoutingProvider:
    return provider or OSRMRoutingProvider()


def get_weather_provider(provider: Optional[BaseWeatherProvider] = None) -> BaseWeatherProvider:
    return provider or OpenMeteoWeatherProvider()


def _analyze_checkpoint(
    checkpoint: Checkpoint,
    weather_item: Dict[str, Any],
    load_weight_lbs: float,
) -> AnalyzedCheckpoint:
    eta_weather = weather_item.get("eta_weather", {})
    wind_mph = float(eta_weather.get("wind_mph", 0.0))
    rain_in_hr = float(eta_weather.get("rain_in_hr", 0.0))
    snow_in_hr = float(eta_weather.get("snow_in_hr", 0.0))

    risk_assessment = evaluate_checkpoint_risk(
        wind_mph=wind_mph,
        rain_in_hr=rain_in_hr,
        snow_in_hr=snow_in_hr,
        load_weight_lbs=load_weight_lbs,
    )

    return AnalyzedCheckpoint(
        checkpoint=checkpoint,
        weather=eta_weather,
        risk=risk_assessment,
        hourly_timeline=weather_item.get("hourly_timeline", []),
    )


def _analyze_route(
    route: RouteOption,
    departure_time: datetime,
    load_weight_lbs: float,
    sample_interval_miles: float,
    weather_provider: BaseWeatherProvider,
) -> AnalyzedRoute:
    checkpoints = sample_route_checkpoints(
        coordinates=route.geometry.get("coordinates", []),
        departure_time=departure_time,
        total_duration_seconds=route.duration_seconds,
        interval_miles=sample_interval_miles,
    )

    weather_data = weather_provider.fetch_weather_for_checkpoints(checkpoints)

    analyzed_checkpoints = [
        _analyze_checkpoint(checkpoint=cp, weather_item=w, load_weight_lbs=load_weight_lbs)
        for cp, w in zip(checkpoints, weather_data)
    ]

    metrics = RouteRiskMetrics.calculate(
        checkpoints=analyzed_checkpoints,
        total_distance_miles=route.distance_miles,
    )

    return AnalyzedRoute(
        id=route.id,
        summary=route.summary,
        distance_miles=route.distance_miles,
        duration_hours=route.duration_hours,
        duration_seconds=route.duration_seconds,
        geometry=route.geometry,
        checkpoints=analyzed_checkpoints,
        metrics=metrics,
    )


def analyze_trip(
    origin: Tuple[float, float],
    destination: Tuple[float, float],
    departure_time: datetime,
    load_weight_lbs: float,
    sample_interval_miles: float = 25.0,
    routing_provider: Optional[BaseRoutingProvider] = None,
    weather_provider: Optional[BaseWeatherProvider] = None,
) -> TripAnalysis:
    routing = get_routing_provider(routing_provider)
    weather = get_weather_provider(weather_provider)

    routes: List[RouteOption] = routing.get_routes(origin, destination, num_alternatives=3)

    if len(routes) > 1:
        with ThreadPoolExecutor(max_workers=min(len(routes), 5)) as executor:
            futures = [
                executor.submit(
                    _analyze_route,
                    route=route,
                    departure_time=departure_time,
                    load_weight_lbs=load_weight_lbs,
                    sample_interval_miles=sample_interval_miles,
                    weather_provider=weather,
                )
                for route in routes
            ]
            analyzed_routes: List[AnalyzedRoute] = [f.result() for f in futures]
    else:
        analyzed_routes = [
            _analyze_route(
                route=route,
                departure_time=departure_time,
                load_weight_lbs=load_weight_lbs,
                sample_interval_miles=sample_interval_miles,
                weather_provider=weather,
            )
            for route in routes
        ]

    ranked_routes = RouteRanker.rank_and_recommend(analyzed_routes)

    return TripAnalysis(
        origin=origin,
        destination=destination,
        departure_time=departure_time,
        load_weight_lbs=load_weight_lbs,
        sample_interval_miles=sample_interval_miles,
        routes=ranked_routes,
    )
