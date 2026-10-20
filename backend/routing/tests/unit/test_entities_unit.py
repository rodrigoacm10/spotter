import pytest
from datetime import datetime, timezone
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
from ..factories import (
    CheckpointFactory,
    CheckpointRiskAssessmentFactory,
    AnalyzedCheckpointFactory,
    RouteRiskMetricsFactory,
    AnalyzedRouteFactory,
    TripAnalysisFactory,
)


@pytest.mark.unit
class TestDomainEntitiesUnit:
    """Unit tests for domain entities, value objects, and aggregate roots."""

    def test_risk_level_properties(self):
        """Verify that RiskLevel enum labels and hex color representations match design specs."""
        assert RiskLevel.LOW.label == "Low"
        assert RiskLevel.LOW.color == "#10B981"
        assert RiskLevel.MODERATE.label == "Moderate"
        assert RiskLevel.MODERATE.color == "#F59E0B"
        assert RiskLevel.HIGH.label == "High"
        assert RiskLevel.HIGH.color == "#F97316"
        assert RiskLevel.SEVERE.label == "Severe"
        assert RiskLevel.SEVERE.color == "#EF4444"
        assert RiskLevel.NO_TRAVEL.label == "No Travel"
        assert RiskLevel.NO_TRAVEL.color == "#7F1D1D"

    def test_checkpoint_to_dict(self, sample_checkpoint):
        """Verify that Checkpoint.to_dict converts geographic coordinate data and ETA into serialized JSON format."""
        data = sample_checkpoint.to_dict()
        assert data["index"] == 0
        assert data["mile"] == 0.0
        assert data["latitude"] == 41.8781
        assert data["longitude"] == -87.6298
        assert "eta" in data

    def test_checkpoint_risk_assessment_to_dict(self):
        """Verify CheckpointRiskAssessment serialization includes overall score, color code, and explanation reasons."""
        assessment = CheckpointRiskAssessmentFactory.build(
            overall_risk=RiskLevel.HIGH,
            wind_risk=RiskLevel.HIGH,
            rain_risk=RiskLevel.MODERATE,
            snow_risk=RiskLevel.LOW,
            wind_mph=38.5,
            rain_in_hr=0.15,
            snow_in_hr=0.0,
            load_weight_lbs=30000.0,
            reasons=["High wind"]
        )
        d = assessment.to_dict()
        assert d["overall_risk"] == "High"
        assert d["overall_risk_value"] == 2
        assert d["color"] == "#F97316"
        assert d["wind_risk"] == "High"
        assert d["rain_risk"] == "Moderate"
        assert d["snow_risk"] == "Low"
        assert d["wind_mph"] == 38.5
        assert d["reasons"] == ["High wind"]

    def test_analyzed_checkpoint_to_dict(self, sample_analyzed_checkpoint):
        """Verify AnalyzedCheckpoint serialization merges geographic checkpoint, weather conditions, and risk assessment."""
        d = sample_analyzed_checkpoint.to_dict()
        assert "weather" in d
        assert "risk" in d
        assert "hourly_timeline" in d
        assert d["risk"]["overall_risk"] == "Low"

    def test_route_risk_metrics_empty(self):
        """Verify factory method RouteRiskMetrics.calculate yields safe zero values when called with an empty list."""
        metrics = RouteRiskMetrics.calculate([], total_distance_miles=150.0)
        assert metrics.total_checkpoints == 0
        assert metrics.average_risk_score == 0.0
        assert metrics.has_no_travel is False
        assert metrics["low_miles"] == 0.0

    def test_route_risk_metrics_getitem_and_to_dict(self, sample_analyzed_checkpoint):
        """Verify dictionary-style subscript access and serialization for RouteRiskMetrics."""
        metrics = RouteRiskMetrics.calculate([sample_analyzed_checkpoint], total_distance_miles=100.0)
        assert metrics["low_miles"] == 100.0
        assert metrics["has_no_travel"] is False
        d = metrics.to_dict()
        assert d["low_miles"] == 100.0
        assert d["total_checkpoints"] == 1

    def test_analyzed_route_comparative_safety_ladder(self):
        """Verify multi-tier safety comparison hierarchy in AnalyzedRoute.is_safer_than."""
        metrics_no_travel = RouteRiskMetricsFactory.build(no_travel_miles=10.0, average_risk_score=4.0, has_no_travel=True)
        metrics_severe = RouteRiskMetricsFactory.build(severe_miles=10.0, average_risk_score=3.0, has_no_travel=False)
        r_nt = AnalyzedRouteFactory.build(id="r1", summary="NT", metrics=metrics_no_travel)
        r_sev = AnalyzedRouteFactory.build(id="r2", summary="Sev", metrics=metrics_severe)
        assert r_sev.is_safer_than(r_nt) is True
        assert r_nt.is_safer_than(r_sev) is False

        m_sev_10 = RouteRiskMetricsFactory.build(severe_miles=10.0, average_risk_score=1.5, has_no_travel=False)
        m_sev_20 = RouteRiskMetricsFactory.build(severe_miles=20.0, average_risk_score=1.5, has_no_travel=False)
        r_sev_10 = AnalyzedRouteFactory.build(id="r10", summary="S10", metrics=m_sev_10)
        r_sev_20 = AnalyzedRouteFactory.build(id="r20", summary="S20", metrics=m_sev_20)
        assert r_sev_10.is_safer_than(r_sev_20) is True

        m_high_5 = RouteRiskMetricsFactory.build(high_miles=5.0, average_risk_score=1.0, has_no_travel=False)
        m_high_15 = RouteRiskMetricsFactory.build(high_miles=15.0, average_risk_score=1.0, has_no_travel=False)
        r_high_5 = AnalyzedRouteFactory.build(id="rh5", summary="H5", metrics=m_high_5)
        r_high_15 = AnalyzedRouteFactory.build(id="rh15", summary="H15", metrics=m_high_15)
        assert r_high_5.is_safer_than(r_high_15) is True

        m_score_1 = RouteRiskMetricsFactory.build(low_miles=50, moderate_miles=50, average_risk_score=0.5, total_checkpoints=2)
        m_score_2 = RouteRiskMetricsFactory.build(low_miles=20, moderate_miles=80, average_risk_score=0.8, total_checkpoints=2)
        r_sc_1 = AnalyzedRouteFactory.build(id="rs1", summary="S1", metrics=m_score_1)
        r_sc_2 = AnalyzedRouteFactory.build(id="rs2", summary="S2", metrics=m_score_2)
        assert r_sc_1.is_safer_than(r_sc_2) is True

        r_quick = AnalyzedRouteFactory.build(id="rq", summary="Quick", duration_seconds=7000, metrics=m_score_1)
        r_slow = AnalyzedRouteFactory.build(id="rsl", summary="Slow", duration_seconds=8000, metrics=m_score_1)
        assert r_quick.is_safer_than(r_slow) is True

    def test_analyzed_route_getitem_and_to_dict(self, sample_analyzed_route):
        """Verify AnalyzedRoute dictionary indexing and comprehensive to_dict serialization."""
        assert sample_analyzed_route["id"] == "route_1"
        assert sample_analyzed_route["is_recommended"] is True
        d = sample_analyzed_route.to_dict()
        assert d["id"] == "route_1"
        assert d["summary"] == "Via I-65 S"
        assert len(d["checkpoints"]) == 1
        assert "metrics" in d

    def test_trip_analysis_aggregate_root(self, sample_analyzed_route):
        """Verify TripAnalysis Aggregate Root properties, recommended_route accessor, and JSON payload serialization."""
        dep = datetime(2026, 10, 18, 8, 0, tzinfo=timezone.utc)
        trip = TripAnalysisFactory.build(
            departure_time=dep,
            load_weight_lbs=42000.0,
            sample_interval_miles=25.0,
            routes=[sample_analyzed_route]
        )

        assert trip.recommended_route == sample_analyzed_route

        sample_analyzed_route.is_recommended = False
        assert trip.recommended_route == sample_analyzed_route

        empty_trip = TripAnalysisFactory.build(routes=[])
        assert empty_trip.recommended_route is None

        d = trip.to_dict()
        assert d["origin"] == {"latitude": 41.8781, "longitude": -87.6298}
        assert d["destination"] == {"latitude": 39.7684, "longitude": -86.1581}
        assert d["load_weight_lbs"] == 42000.0
        assert len(d["routes"]) == 1
