import pytest
from routing.domain.entities import RiskLevel
from routing.domain.risk import (
    classify_wind,
    classify_rain,
    classify_snow,
    evaluate_checkpoint_risk,
)


@pytest.mark.unit
class TestRiskClassificationUnit:
    """Unit tests for weather thresholds and cargo weight risk rules."""

    def test_classify_wind_regular_load(self):
        """Verify that wind speeds are classified into appropriate risk levels under normal load (<= 30,000 lbs)."""
        load = 25000.0
        assert classify_wind(0.0, load) == RiskLevel.LOW
        assert classify_wind(24.9, load) == RiskLevel.LOW
        assert classify_wind(25.0, load) == RiskLevel.MODERATE
        assert classify_wind(34.9, load) == RiskLevel.MODERATE
        assert classify_wind(35.0, load) == RiskLevel.HIGH
        assert classify_wind(44.9, load) == RiskLevel.HIGH
        assert classify_wind(45.0, load) == RiskLevel.SEVERE
        assert classify_wind(54.9, load) == RiskLevel.SEVERE
        assert classify_wind(55.0, load) == RiskLevel.NO_TRAVEL
        assert classify_wind(75.0, load) == RiskLevel.NO_TRAVEL

    def test_classify_wind_heavy_load_rules(self):
        """Verify cargo load weight escalation rules for heavy loads (>30k lbs and >40k lbs)."""
        # Rule 1: >= 55 mph -> No Travel regardless of weight
        assert classify_wind(55.0, 10000.0) == RiskLevel.NO_TRAVEL
        assert classify_wind(60.0, 50000.0) == RiskLevel.NO_TRAVEL

        # Rule 2: 45–54 mph + > 30,000 lbs -> No Travel
        assert classify_wind(50.0, 30000.0) == RiskLevel.SEVERE
        assert classify_wind(50.0, 30001.0) == RiskLevel.NO_TRAVEL
        assert classify_wind(45.0, 42000.0) == RiskLevel.NO_TRAVEL

        # Rule 3: 35–44 mph + > 40,000 lbs -> Severe
        assert classify_wind(40.0, 40000.0) == RiskLevel.HIGH
        assert classify_wind(40.0, 40001.0) == RiskLevel.SEVERE
        assert classify_wind(35.0, 45000.0) == RiskLevel.SEVERE

    def test_classify_rain(self):
        """Verify rainfall precipitation rate thresholds and risk categories."""
        assert classify_rain(0.0) == RiskLevel.LOW
        assert classify_rain(0.09) == RiskLevel.LOW
        assert classify_rain(0.10) == RiskLevel.MODERATE
        assert classify_rain(0.24) == RiskLevel.MODERATE
        assert classify_rain(0.25) == RiskLevel.HIGH
        assert classify_rain(0.49) == RiskLevel.HIGH
        assert classify_rain(0.50) == RiskLevel.SEVERE
        assert classify_rain(1.00) == RiskLevel.SEVERE
        assert classify_rain(1.01) == RiskLevel.NO_TRAVEL
        assert classify_rain(2.50) == RiskLevel.NO_TRAVEL

    def test_classify_snow(self):
        """Verify snowfall precipitation rate thresholds and risk categories."""
        assert classify_snow(0.0) == RiskLevel.LOW
        assert classify_snow(0.49) == RiskLevel.LOW
        assert classify_snow(0.50) == RiskLevel.MODERATE
        assert classify_snow(0.99) == RiskLevel.MODERATE
        assert classify_snow(1.00) == RiskLevel.HIGH
        assert classify_snow(1.99) == RiskLevel.HIGH
        assert classify_snow(2.00) == RiskLevel.SEVERE
        assert classify_snow(3.00) == RiskLevel.SEVERE
        assert classify_snow(3.01) == RiskLevel.NO_TRAVEL
        assert classify_snow(5.00) == RiskLevel.NO_TRAVEL

    def test_evaluate_checkpoint_risk_worst_condition(self):
        """Verify that overall checkpoint risk takes the maximum severity among wind, rain, and snow."""
        assessment = evaluate_checkpoint_risk(
            wind_mph=10.0,
            rain_in_hr=0.6,
            snow_in_hr=0.0,
            load_weight_lbs=20000.0
        )
        assert assessment.overall_risk == RiskLevel.SEVERE
        assert assessment.rain_risk == RiskLevel.SEVERE
        assert assessment.wind_risk == RiskLevel.LOW
        assert assessment.snow_risk == RiskLevel.LOW

    def test_evaluate_checkpoint_risk_reasons_generation(self):
        """Verify that descriptive explanation reasons are generated for every high-risk condition."""
        assessment = evaluate_checkpoint_risk(wind_mph=56.0, rain_in_hr=0.0, snow_in_hr=0.0, load_weight_lbs=20000.0)
        assert assessment.overall_risk == RiskLevel.NO_TRAVEL
        assert any("Extreme wind" in r for r in assessment.reasons)

        assessment = evaluate_checkpoint_risk(wind_mph=48.0, rain_in_hr=0.0, snow_in_hr=0.0, load_weight_lbs=35000.0)
        assert assessment.overall_risk == RiskLevel.NO_TRAVEL
        assert any("Severe wind" in r and "heavy load" in r for r in assessment.reasons)

        assessment = evaluate_checkpoint_risk(wind_mph=38.0, rain_in_hr=0.0, snow_in_hr=0.0, load_weight_lbs=42000.0)
        assert assessment.overall_risk == RiskLevel.SEVERE
        assert any("High wind" in r and "escalated to Severe" in r for r in assessment.reasons)

        assessment = evaluate_checkpoint_risk(wind_mph=10.0, rain_in_hr=1.2, snow_in_hr=0.0, load_weight_lbs=20000.0)
        assert assessment.overall_risk == RiskLevel.NO_TRAVEL
        assert any("Torrential rain" in r for r in assessment.reasons)

        assessment = evaluate_checkpoint_risk(wind_mph=10.0, rain_in_hr=0.3, snow_in_hr=0.0, load_weight_lbs=20000.0)
        assert assessment.overall_risk == RiskLevel.HIGH
        assert any("Heavy rain" in r for r in assessment.reasons)

        assessment = evaluate_checkpoint_risk(wind_mph=10.0, rain_in_hr=0.0, snow_in_hr=3.5, load_weight_lbs=20000.0)
        assert assessment.overall_risk == RiskLevel.NO_TRAVEL
        assert any("Extreme snowfall" in r for r in assessment.reasons)

        assessment = evaluate_checkpoint_risk(wind_mph=10.0, rain_in_hr=0.0, snow_in_hr=1.5, load_weight_lbs=20000.0)
        assert assessment.overall_risk == RiskLevel.HIGH
        assert any("Heavy snowfall" in r for r in assessment.reasons)
