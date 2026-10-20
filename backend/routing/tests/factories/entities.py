"""
Domain entity and value object test factories.
Provides builders for Checkpoints, Risk Assessments, Route Options, Metrics, and Trip Analyses.
"""
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Tuple

from routing.domain.entities import (
    RiskLevel,
    RouteOption,
    Checkpoint,
    CheckpointRiskAssessment,
    AnalyzedCheckpoint,
    RouteRiskMetrics,
    AnalyzedRoute,
    TripAnalysis,
)


class CheckpointFactory:
    """Factory for generating route Checkpoint instances."""

    @staticmethod
    def build(
        index: int = 0,
        mile: float = 0.0,
        latitude: float = 41.8781,
        longitude: float = -87.6298,
        eta: Optional[datetime] = None,
    ) -> Checkpoint:
        default_eta = eta or datetime(2026, 10, 18, 8, 0, tzinfo=timezone.utc)
        return Checkpoint(
            index=index,
            mile=mile,
            latitude=latitude,
            longitude=longitude,
            eta=default_eta,
        )


class CheckpointRiskAssessmentFactory:
    """Factory for generating CheckpointRiskAssessment value objects."""

    @staticmethod
    def build(
        overall_risk: RiskLevel = RiskLevel.LOW,
        wind_risk: RiskLevel = RiskLevel.LOW,
        rain_risk: RiskLevel = RiskLevel.LOW,
        snow_risk: RiskLevel = RiskLevel.LOW,
        wind_mph: float = 12.0,
        rain_in_hr: float = 0.0,
        snow_in_hr: float = 0.0,
        load_weight_lbs: float = 35000.0,
        reasons: Optional[List[str]] = None,
    ) -> CheckpointRiskAssessment:
        return CheckpointRiskAssessment(
            overall_risk=overall_risk,
            wind_risk=wind_risk,
            rain_risk=rain_risk,
            snow_risk=snow_risk,
            wind_mph=wind_mph,
            rain_in_hr=rain_in_hr,
            snow_in_hr=snow_in_hr,
            load_weight_lbs=load_weight_lbs,
            reasons=reasons or [],
        )


class AnalyzedCheckpointFactory:
    """Factory for generating AnalyzedCheckpoint domain entities."""

    @staticmethod
    def build(
        checkpoint: Optional[Checkpoint] = None,
        weather: Optional[Dict[str, Any]] = None,
        risk: Optional[CheckpointRiskAssessment] = None,
        hourly_timeline: Optional[List[Dict[str, Any]]] = None,
    ) -> AnalyzedCheckpoint:
        cp = checkpoint or CheckpointFactory.build()
        risk_obj = risk or CheckpointRiskAssessmentFactory.build()
        weather_dict = weather or {
            "forecast_time": cp.eta.isoformat(),
            "wind_mph": 12.0,
            "rain_in_hr": 0.0,
            "snow_in_hr": 0.0,
            "temperature": 68.0,
        }
        timeline = hourly_timeline or [
            {
                "hour_offset": h,
                "time": (cp.eta + timedelta(hours=h)).isoformat(),
                "wind_mph": 12.0,
                "rain_in_hr": 0.0,
                "snow_in_hr": 0.0,
                "temperature": 68.0,
            }
            for h in range(48)
        ]
        return AnalyzedCheckpoint(
            checkpoint=cp,
            weather=weather_dict,
            risk=risk_obj,
            hourly_timeline=timeline,
        )


class RouteOptionFactory:
    """Factory for generating RouteOption entity instances."""

    @staticmethod
    def build(
        id: str = "route_1",
        summary: str = "Via I-65 S",
        distance_meters: float = 290000.0,
        distance_miles: float = 180.0,
        duration_seconds: float = 10800.0,
        duration_hours: float = 3.0,
        coordinates: Optional[List[List[float]]] = None,
    ) -> RouteOption:
        coords = coordinates or [
            [-87.6298, 41.8781],
            [-86.8000, 40.8000],
            [-86.1581, 39.7684],
        ]
        return RouteOption(
            id=id,
            summary=summary,
            distance_meters=distance_meters,
            distance_miles=distance_miles,
            duration_seconds=duration_seconds,
            duration_hours=duration_hours,
            geometry={"type": "LineString", "coordinates": coords},
        )


class RouteRiskMetricsFactory:
    """Factory for generating RouteRiskMetrics value objects."""

    @staticmethod
    def build(
        low_miles: float = 180.0,
        moderate_miles: float = 0.0,
        high_miles: float = 0.0,
        severe_miles: float = 0.0,
        no_travel_miles: float = 0.0,
        average_risk_score: float = 0.0,
        has_no_travel: bool = False,
        total_checkpoints: int = 1,
    ) -> RouteRiskMetrics:
        return RouteRiskMetrics(
            low_miles=low_miles,
            moderate_miles=moderate_miles,
            high_miles=high_miles,
            severe_miles=severe_miles,
            no_travel_miles=no_travel_miles,
            average_risk_score=average_risk_score,
            has_no_travel=has_no_travel,
            total_checkpoints=total_checkpoints,
        )


class AnalyzedRouteFactory:
    """Factory for generating AnalyzedRoute rich domain entities."""

    @staticmethod
    def build(
        id: str = "route_1",
        summary: str = "Via I-65 S",
        distance_miles: float = 180.0,
        duration_hours: float = 3.0,
        duration_seconds: float = 10800.0,
        geometry: Optional[Dict[str, Any]] = None,
        checkpoints: Optional[List[AnalyzedCheckpoint]] = None,
        metrics: Optional[RouteRiskMetrics] = None,
        is_recommended: bool = True,
        rank: int = 1,
        recommendation_reason: Optional[str] = "Optimal route.",
    ) -> AnalyzedRoute:
        geom = geometry or {
            "type": "LineString",
            "coordinates": [[-87.6298, 41.8781], [-86.1581, 39.7684]],
        }
        cps = checkpoints or [AnalyzedCheckpointFactory.build()]
        met = metrics or RouteRiskMetricsFactory.build()
        return AnalyzedRoute(
            id=id,
            summary=summary,
            distance_miles=distance_miles,
            duration_hours=duration_hours,
            duration_seconds=duration_seconds,
            geometry=geom,
            checkpoints=cps,
            metrics=met,
            is_recommended=is_recommended,
            rank=rank,
            recommendation_reason=recommendation_reason,
        )


class TripAnalysisFactory:
    """Factory for generating TripAnalysis aggregate roots."""

    @staticmethod
    def build(
        origin: Tuple[float, float] = (41.8781, -87.6298),
        destination: Tuple[float, float] = (39.7684, -86.1581),
        departure_time: Optional[datetime] = None,
        load_weight_lbs: float = 42000.0,
        sample_interval_miles: float = 25.0,
        routes: Optional[List[AnalyzedRoute]] = None,
    ) -> TripAnalysis:
        dep = departure_time or datetime(2026, 10, 18, 8, 0, tzinfo=timezone.utc)
        route_list = routes if routes is not None else [AnalyzedRouteFactory.build()]
        return TripAnalysis(
            origin=origin,
            destination=destination,
            departure_time=dep,
            load_weight_lbs=load_weight_lbs,
            sample_interval_miles=sample_interval_miles,
            routes=route_list,
        )
