from typing import List
from .entities import AnalyzedRoute, RouteRiskMetrics, AnalyzedCheckpoint


class RouteRanker:
    @staticmethod
    def rank_and_recommend(routes: List[AnalyzedRoute]) -> List[AnalyzedRoute]:
        if not routes:
            return []

        sorted_routes = sorted(
            routes,
            key=lambda route: (
                1 if route.metrics.has_no_travel else 0,
                route.metrics.severe_miles,
                route.metrics.high_miles,
                route.metrics.average_risk_score,
                route.duration_seconds
            )
        )

        for rank_index, route in enumerate(sorted_routes):
            route.is_recommended = (rank_index == 0)
            route.rank = rank_index + 1
            if rank_index == 0:
                if route.metrics.has_no_travel:
                    route.recommendation_reason = "Warning: All routes contain No Travel sections. This route presents the lowest overall risk."
                else:
                    route.recommendation_reason = "Optimal balance between lowest weather risk and shortest travel time."

        return sorted_routes


def calculate_route_risk_metrics(
    checkpoints: List[AnalyzedCheckpoint],
    total_distance_miles: float,
) -> RouteRiskMetrics:
    """Wrapper around RouteRiskMetrics.calculate for functional access."""
    return RouteRiskMetrics.calculate(checkpoints=checkpoints, total_distance_miles=total_distance_miles)


def rank_and_recommend_routes(analyzed_routes: List[AnalyzedRoute]) -> List[AnalyzedRoute]:
    """Wrapper around RouteRanker.rank_and_recommend for functional access."""
    return RouteRanker.rank_and_recommend(analyzed_routes)
