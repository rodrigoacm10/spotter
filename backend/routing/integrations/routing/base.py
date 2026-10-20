from abc import ABC, abstractmethod
from typing import List, Tuple
from ...domain.entities import RouteOption


class BaseRoutingProvider(ABC):
    @abstractmethod
    def get_routes(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        num_alternatives: int = 3
    ) -> List[RouteOption]:
        pass
