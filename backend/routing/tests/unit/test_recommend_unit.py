import pytest
from routing.domain import (
    calculate_route_risk_metrics,
    rank_and_recommend_routes,
    RiskLevel,
    RouteRiskMetrics,
    AnalyzedRoute,
    RouteRanker,
)
from ..factories import (
    AnalyzedRouteFactory,
    RouteRiskMetricsFactory,
    AnalyzedCheckpointFactory,
    CheckpointRiskAssessmentFactory,
    CheckpointFactory,
)


@pytest.mark.unit
class TestRecommendUnit:
    """Unit tests for route ranking and risk metric aggregation."""

    def test_rank_and_recommend_empty_list(self):
        """Verify that passing an empty list of routes returns an empty list without errors."""
        assert RouteRanker.rank_and_recommend([]) == []
        assert rank_and_recommend_routes([]) == []

    def test_recommendation_prioritizes_fewer_severe_miles(self, sample_analyzed_checkpoint):
        """Verify that the route ranking algorithm prioritizes fewer severe weather miles over shorter duration."""
        metrics_a = RouteRiskMetricsFactory.build(
            has_no_travel=False,
            severe_miles=50.0,
            high_miles=0.0,
            average_risk_score=1.5,
        )
        route_a = AnalyzedRouteFactory.build(
            id="route_a",
            duration_seconds=14400.0,
            checkpoints=[sample_analyzed_checkpoint],
            metrics=metrics_a,
        )

        metrics_b = RouteRiskMetricsFactory.build(
            has_no_travel=False,
            severe_miles=0.0,
            high_miles=10.0,
            average_risk_score=1.2,
        )
        route_b = AnalyzedRouteFactory.build(
            id="route_b",
            duration_seconds=18000.0,
            checkpoints=[sample_analyzed_checkpoint],
            metrics=metrics_b,
        )

        ranked = rank_and_recommend_routes([route_a, route_b])
        assert ranked[0].id == "route_b"
        assert ranked[0].is_recommended is True
        assert ranked[1].id == "route_a"
        assert ranked[1].is_recommended is False

    def test_recommendation_penalizes_no_travel(self, sample_analyzed_checkpoint):
        """Verify that routes with 'No Travel' weather warnings are strictly penalized behind viable routes."""
        metrics_a = RouteRiskMetricsFactory.build(
            has_no_travel=True,
            severe_miles=0.0,
            high_miles=0.0,
            average_risk_score=2.0,
        )
        route_a = AnalyzedRouteFactory.build(
            id="route_a",
            duration_seconds=7200.0,
            checkpoints=[sample_analyzed_checkpoint],
            metrics=metrics_a,
        )

        metrics_b = RouteRiskMetricsFactory.build(
            has_no_travel=False,
            severe_miles=10.0,
            high_miles=20.0,
            average_risk_score=1.8,
        )
        route_b = AnalyzedRouteFactory.build(
            id="route_b",
            duration_seconds=10800.0,
            checkpoints=[sample_analyzed_checkpoint],
            metrics=metrics_b,
        )

        ranked = rank_and_recommend_routes([route_a, route_b])
        assert ranked[0].id == "route_b"
        assert ranked[1].id == "route_a"

    def test_recommendation_when_all_routes_contain_no_travel(self, sample_analyzed_checkpoint):
        """Verify recommendation warning reason is attached when every available route contains No Travel sections."""
        metrics_a = RouteRiskMetricsFactory.build(
            has_no_travel=True,
            severe_miles=10.0,
            high_miles=0.0,
            average_risk_score=3.0,
        )
        route_a = AnalyzedRouteFactory.build(
            id="route_a",
            duration_seconds=7200.0,
            checkpoints=[sample_analyzed_checkpoint],
            metrics=metrics_a,
        )

        metrics_b = RouteRiskMetricsFactory.build(
            has_no_travel=True,
            severe_miles=20.0,
            high_miles=0.0,
            average_risk_score=3.5,
        )
        route_b = AnalyzedRouteFactory.build(
            id="route_b",
            duration_seconds=9000.0,
            checkpoints=[sample_analyzed_checkpoint],
            metrics=metrics_b,
        )

        ranked = rank_and_recommend_routes([route_a, route_b])
        assert ranked[0].id == "route_a"
        assert "Warning: All routes contain No Travel sections" in (ranked[0].recommendation_reason or "")

    def test_calculate_route_risk_metrics_empty(self):
        """Verify that calculating route risk metrics for empty checkpoint lists returns zeroed metrics."""
        metrics = calculate_route_risk_metrics([], 100.0)
        assert metrics.total_checkpoints == 0
        assert metrics.low_miles == 0.0
        assert metrics.has_no_travel is False

    def test_calculate_route_risk_metrics_with_analyzed_checkpoints(self):
        """Verify risk metric aggregation works correctly with AnalyzedCheckpoint domain entities across all risk tiers."""
        risk_tiers = [
            RiskLevel.LOW,
            RiskLevel.MODERATE,
            RiskLevel.HIGH,
            RiskLevel.SEVERE,
            RiskLevel.NO_TRAVEL,
        ]
        checkpoints = [
            AnalyzedCheckpointFactory.build(
                checkpoint=CheckpointFactory.build(index=i, mile=i * 20.0),
                risk=CheckpointRiskAssessmentFactory.build(overall_risk=risk),
            )
            for i, risk in enumerate(risk_tiers)
        ]

        metrics = calculate_route_risk_metrics(checkpoints, total_distance_miles=100.0)
        assert metrics.total_checkpoints == 5
        assert metrics.low_miles == 20.0
        assert metrics.moderate_miles == 20.0
        assert metrics.high_miles == 20.0
        assert metrics.severe_miles == 20.0
        assert metrics.no_travel_miles == 20.0
        assert metrics.has_no_travel is True
        assert metrics.average_risk_score == 2.0

    def test_rank_and_recommend_with_analyzed_route_entities(self, sample_analyzed_checkpoint):
        """Verify route ranker operates on AnalyzedRoute entities and designates is_recommended flag and rank 1."""
        metrics_safe = RouteRiskMetricsFactory.build(
            low_miles=100.0,
            moderate_miles=0.0,
            high_miles=0.0,
            severe_miles=0.0,
            no_travel_miles=0.0,
            average_risk_score=0.0,
            has_no_travel=False,
            total_checkpoints=1,
        )
        metrics_risky = RouteRiskMetricsFactory.build(
            low_miles=0.0,
            moderate_miles=0.0,
            high_miles=0.0,
            severe_miles=100.0,
            no_travel_miles=0.0,
            average_risk_score=3.0,
            has_no_travel=False,
            total_checkpoints=1,
        )

        safe_route = AnalyzedRouteFactory.build(
            id="safe",
            summary="Route Safe",
            distance_miles=100.0,
            duration_hours=2.0,
            duration_seconds=7200.0,
            checkpoints=[sample_analyzed_checkpoint],
            metrics=metrics_safe,
        )
        risky_route = AnalyzedRouteFactory.build(
            id="risky",
            summary="Route Risky",
            distance_miles=90.0,
            duration_hours=1.8,
            duration_seconds=6500.0,
            checkpoints=[sample_analyzed_checkpoint],
            metrics=metrics_risky,
        )

        ranked = rank_and_recommend_routes([risky_route, safe_route])
        assert ranked[0].id == "safe"
        assert ranked[0].is_recommended is True
        assert ranked[0].rank == 1
        assert ranked[1].id == "risky"
        assert ranked[1].is_recommended is False
        assert ranked[1].rank == 2
