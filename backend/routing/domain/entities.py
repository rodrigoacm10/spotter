from dataclasses import dataclass, field
from enum import IntEnum
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple


class RiskLevel(IntEnum):
    LOW = 0
    MODERATE = 1
    HIGH = 2
    SEVERE = 3
    NO_TRAVEL = 4

    @property
    def label(self) -> str:
        return {
            RiskLevel.LOW: "Low",
            RiskLevel.MODERATE: "Moderate",
            RiskLevel.HIGH: "High",
            RiskLevel.SEVERE: "Severe",
            RiskLevel.NO_TRAVEL: "No Travel"
        }[self]

    @property
    def color(self) -> str:
        return {
            RiskLevel.LOW: "#10B981",
            RiskLevel.MODERATE: "#F59E0B",
            RiskLevel.HIGH: "#F97316",
            RiskLevel.SEVERE: "#EF4444",
            RiskLevel.NO_TRAVEL: "#7F1D1D"
        }[self]


@dataclass
class RouteOption:
    id: str
    summary: str
    distance_meters: float
    distance_miles: float
    duration_seconds: float
    duration_hours: float
    geometry: Dict[str, Any]


@dataclass
class Checkpoint:
    index: int
    mile: float
    latitude: float
    longitude: float
    eta: datetime

    def to_dict(self) -> Dict[str, Any]:
        return {
            "index": self.index,
            "mile": round(self.mile, 1),
            "latitude": round(self.latitude, 5),
            "longitude": round(self.longitude, 5),
            "eta": self.eta.isoformat(),
        }


@dataclass
class CheckpointRiskAssessment:
    overall_risk: RiskLevel
    wind_risk: RiskLevel
    rain_risk: RiskLevel
    snow_risk: RiskLevel
    wind_mph: float
    rain_in_hr: float
    snow_in_hr: float
    load_weight_lbs: float
    reasons: list[str]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "overall_risk": self.overall_risk.label,
            "overall_risk_value": int(self.overall_risk),
            "color": self.overall_risk.color,
            "wind_risk": self.wind_risk.label,
            "rain_risk": self.rain_risk.label,
            "snow_risk": self.snow_risk.label,
            "wind_mph": round(self.wind_mph, 1),
            "rain_in_hr": round(self.rain_in_hr, 2),
            "snow_in_hr": round(self.snow_in_hr, 2),
            "reasons": self.reasons
        }


@dataclass
class AnalyzedCheckpoint:
    checkpoint: Checkpoint
    weather: Dict[str, Any]
    risk: CheckpointRiskAssessment
    hourly_timeline: List[Dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        data = self.checkpoint.to_dict()
        data["weather"] = self.weather
        data["risk"] = self.risk.to_dict()
        data["hourly_timeline"] = self.hourly_timeline
        return data


@dataclass
class RouteRiskMetrics:
    low_miles: float
    moderate_miles: float
    high_miles: float
    severe_miles: float
    no_travel_miles: float
    average_risk_score: float
    has_no_travel: bool
    total_checkpoints: int

    @classmethod
    def calculate(
        cls,
        checkpoints: List[AnalyzedCheckpoint],
        total_distance_miles: float
    ) -> "RouteRiskMetrics":
        if not checkpoints:
            return cls(
                low_miles=0.0,
                moderate_miles=0.0,
                high_miles=0.0,
                severe_miles=0.0,
                no_travel_miles=0.0,
                average_risk_score=0.0,
                has_no_travel=False,
                total_checkpoints=0,
            )

        total_points = len(checkpoints)
        miles_per_point = total_distance_miles / total_points if total_points > 0 else 0.0

        counts = {
            RiskLevel.LOW: 0,
            RiskLevel.MODERATE: 0,
            RiskLevel.HIGH: 0,
            RiskLevel.SEVERE: 0,
            RiskLevel.NO_TRAVEL: 0,
        }
        sum_scores = 0.0

        for checkpoint in checkpoints:
            risk_enum = checkpoint.risk.overall_risk
            counts[risk_enum] = counts.get(risk_enum, 0) + 1
            sum_scores += int(risk_enum)

        return cls(
            low_miles=round(counts[RiskLevel.LOW] * miles_per_point, 1),
            moderate_miles=round(counts[RiskLevel.MODERATE] * miles_per_point, 1),
            high_miles=round(counts[RiskLevel.HIGH] * miles_per_point, 1),
            severe_miles=round(counts[RiskLevel.SEVERE] * miles_per_point, 1),
            no_travel_miles=round(counts[RiskLevel.NO_TRAVEL] * miles_per_point, 1),
            average_risk_score=round(sum_scores / total_points, 2) if total_points > 0 else 0.0,
            has_no_travel=counts[RiskLevel.NO_TRAVEL] > 0,
            total_checkpoints=total_points,
        )

    def __getitem__(self, item: str) -> Any:
        return getattr(self, item)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "low_miles": self.low_miles,
            "moderate_miles": self.moderate_miles,
            "high_miles": self.high_miles,
            "severe_miles": self.severe_miles,
            "no_travel_miles": self.no_travel_miles,
            "average_risk_score": self.average_risk_score,
            "has_no_travel": self.has_no_travel,
            "total_checkpoints": self.total_checkpoints,
        }


@dataclass
class AnalyzedRoute:
    id: str
    summary: str
    distance_miles: float
    duration_hours: float
    duration_seconds: float
    geometry: Dict[str, Any]
    checkpoints: List[AnalyzedCheckpoint]
    metrics: RouteRiskMetrics
    is_recommended: bool = False
    rank: int = 1
    recommendation_reason: Optional[str] = None

    def __getitem__(self, item: str) -> Any:
        return getattr(self, item)

    def is_safer_than(self, other: "AnalyzedRoute") -> bool:
        """
        Domain rule for comparative safety between two routes:
        1. Routes without 'No Travel' always outrank routes with 'No Travel'
        2. Fewer miles under Severe weather conditions
        3. Fewer miles under High weather conditions
        4. Lower weighted average risk score
        5. Shorter travel duration in seconds
        """
        key_self = (
            1 if self.metrics.has_no_travel else 0,
            self.metrics.severe_miles,
            self.metrics.high_miles,
            self.metrics.average_risk_score,
            self.duration_seconds
        )
        key_other = (
            1 if other.metrics.has_no_travel else 0,
            other.metrics.severe_miles,
            other.metrics.high_miles,
            other.metrics.average_risk_score,
            other.duration_seconds
        )
        return key_self < key_other

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "summary": self.summary,
            "distance_miles": self.distance_miles,
            "duration_hours": self.duration_hours,
            "duration_seconds": self.duration_seconds,
            "geometry": self.geometry,
            "checkpoints": [checkpoint.to_dict() for checkpoint in self.checkpoints],
            "metrics": self.metrics.to_dict(),
            "is_recommended": self.is_recommended,
            "rank": self.rank,
            "recommendation_reason": self.recommendation_reason,
        }


@dataclass
class TripAnalysis:
    origin: Tuple[float, float]
    destination: Tuple[float, float]
    departure_time: datetime
    load_weight_lbs: float
    sample_interval_miles: float
    routes: List[AnalyzedRoute]

    @property
    def recommended_route(self) -> Optional[AnalyzedRoute]:
        for route in self.routes:
            if route.is_recommended:
                return route
        return self.routes[0] if self.routes else None

    def __getitem__(self, item: str) -> Any:
        return self.to_dict()[item]

    def __contains__(self, item: str) -> bool:
        return item in self.to_dict()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "origin": {"latitude": self.origin[0], "longitude": self.origin[1]},
            "destination": {"latitude": self.destination[0], "longitude": self.destination[1]},
            "departure_time": self.departure_time.isoformat(),
            "load_weight_lbs": self.load_weight_lbs,
            "sample_interval_miles": self.sample_interval_miles,
            "routes": [route.to_dict() for route in self.routes],
        }
