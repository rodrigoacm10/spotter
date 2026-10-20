from typing import Any, Dict, Optional
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError

logger = logging.getLogger(__name__)


class SpotterBaseException(RuntimeError):
    default_code = "spotter_error"
    default_message = "An application error occurred."
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR

    def __init__(
        self,
        message: Optional[str] = None,
        code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        status_code: Optional[int] = None,
    ):
        self.message = message or self.default_message
        self.code = code or self.default_code
        self.details = details or {}
        if status_code is not None:
            self.status_code = status_code
        super().__init__(self.message)


class ProviderError(SpotterBaseException):
    default_code = "provider_error"
    default_message = "An external service provider failed to respond or returned an error."
    status_code = status.HTTP_502_BAD_GATEWAY

    def __init__(
        self,
        provider: str,
        message: Optional[str] = None,
        code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        status_code: Optional[int] = None,
    ):
        self.provider = provider
        details = details or {}
        details["provider"] = provider
        super().__init__(
            message=message or f"External provider '{provider}' failed to respond.",
            code=code or self.default_code,
            details=details,
            status_code=status_code or self.status_code
        )


class RoutingProviderError(ProviderError):
    default_code = "routing_provider_error"
    default_message = "Routing service provider (OSRM) encountered a failure."

    def __init__(self, message: Optional[str] = None, details: Optional[Dict[str, Any]] = None, status_code: Optional[int] = None):
        super().__init__(provider="OSRM", message=message, code=self.default_code, details=details, status_code=status_code)


class WeatherProviderError(ProviderError):
    default_code = "weather_provider_error"
    default_message = "Weather forecast service provider (Open-Meteo) encountered a failure."

    def __init__(self, message: Optional[str] = None, details: Optional[Dict[str, Any]] = None, status_code: Optional[int] = None):
        super().__init__(provider="Open-Meteo", message=message, code=self.default_code, details=details, status_code=status_code)


class GeocodingProviderError(ProviderError):
    default_code = "geocoding_provider_error"
    default_message = "Geocoding service provider (Nominatim) encountered a failure."

    def __init__(self, message: Optional[str] = None, details: Optional[Dict[str, Any]] = None, status_code: Optional[int] = None):
        super().__init__(provider="Nominatim", message=message, code=self.default_code, details=details, status_code=status_code)


class NoRouteFoundError(SpotterBaseException):
    default_code = "no_route_found"
    default_message = "Could not find a valid driving route between origin and destination coordinates."
    status_code = status.HTTP_404_NOT_FOUND


class ProviderTimeoutError(ProviderError):
    default_code = "provider_timeout"
    default_message = "The external service timed out while processing the request."
    status_code = status.HTTP_504_GATEWAY_TIMEOUT


def custom_exception_handler(exc: Exception, context: Dict[str, Any]) -> Response:
    if isinstance(exc, SpotterBaseException):
        logger.warning(
            f"Handled application exception [{exc.code}] status={exc.status_code}: {exc.message}"
        )
        return Response(
            {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
            status=exc.status_code,
        )

    response = exception_handler(exc, context)

    if response is not None:
        if isinstance(exc, ValidationError):
            return Response(
                {
                    "code": "validation_error",
                    "message": "Invalid request parameters.",
                    "details": response.data,
                },
                status=response.status_code,
            )

        return Response(
            {
                "code": getattr(exc, "default_code", "api_error"),
                "message": (
                    response.data.get("detail", str(response.data))
                    if isinstance(response.data, dict)
                    else str(response.data)
                ),
                "details": response.data if isinstance(response.data, dict) else {},
            },
            status=response.status_code,
        )

    logger.exception("Unhandled server exception in request handler")
    return Response(
        {
            "code": "internal_server_error",
            "message": "An unexpected server error occurred while processing the request.",
            "details": {},
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
