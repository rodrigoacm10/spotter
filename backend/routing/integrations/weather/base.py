from abc import ABC, abstractmethod
from typing import List, Dict, Any
from ...domain.entities import Checkpoint


class BaseWeatherProvider(ABC):
    @abstractmethod
    def fetch_weather_for_checkpoints(
        self,
        checkpoints: List[Checkpoint],
        forecast_days: int = 2
    ) -> List[Dict[str, Any]]:
        pass
