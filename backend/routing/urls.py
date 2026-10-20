from django.urls import path
from .views import AnalyzeTripView, GeocodeView, HealthCheckView

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('geocode/', GeocodeView.as_view(), name='geocode'),
    path('routes/analyze/', AnalyzeTripView.as_view(), name='analyze-trip'),
]
