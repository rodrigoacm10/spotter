from abc import ABC, abstractmethod
from typing import List, Dict, Any


class BaseGeocodingProvider(ABC):
    @abstractmethod
    def search_locations(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        pass
