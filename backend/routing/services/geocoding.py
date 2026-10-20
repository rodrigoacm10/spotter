from typing import List, Dict, Any, Optional
from ..integrations.geocoding import BaseGeocodingProvider, NominatimGeocodingProvider


def get_geocoding_provider(provider: Optional[BaseGeocodingProvider] = None) -> BaseGeocodingProvider:
    return provider or NominatimGeocodingProvider()


def search_locations(
    query: str,
    limit: int = 5,
    provider: Optional[BaseGeocodingProvider] = None
) -> List[Dict[str, Any]]:
    geo_provider = get_geocoding_provider(provider)
    return geo_provider.search_locations(query=query, limit=limit)
