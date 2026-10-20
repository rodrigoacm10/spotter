from typing import List
from .entities import RiskLevel, CheckpointRiskAssessment


def classify_wind(wind_mph: float, load_weight_lbs: float) -> RiskLevel:
    """
    Wind Speed Thresholds:
    - Low: < 25 mph
    - Moderate: 25–34 mph
    - High: 35–44 mph
    - Severe: 45–54 mph
    - No Travel: >= 55 mph

    Cargo Load Weight Rules:
    - >= 55 mph -> No Travel for any load weight
    - 45–54 mph + > 30,000 lbs -> No Travel
    - 35–44 mph + > 40,000 lbs -> Severe
    """
    if wind_mph >= 55.0:
        return RiskLevel.NO_TRAVEL

    if 45.0 <= wind_mph < 55.0:
        if load_weight_lbs > 30000.0:
            return RiskLevel.NO_TRAVEL
        return RiskLevel.SEVERE

    if 35.0 <= wind_mph < 45.0:
        if load_weight_lbs > 40000.0:
            return RiskLevel.SEVERE
        return RiskLevel.HIGH

    if 25.0 <= wind_mph < 35.0:
        return RiskLevel.MODERATE

    return RiskLevel.LOW


def classify_rain(rain_in_hr: float) -> RiskLevel:
    """
    Rain Precipitation Thresholds:
    - Low: < 0.10 in/hr
    - Moderate: 0.10–0.25 in/hr
    - High: 0.25–0.50 in/hr
    - Severe: 0.50–1.00 in/hr
    - No Travel: > 1.00 in/hr
    """
    if rain_in_hr > 1.00:
        return RiskLevel.NO_TRAVEL
    if rain_in_hr >= 0.50:
        return RiskLevel.SEVERE
    if rain_in_hr >= 0.25:
        return RiskLevel.HIGH
    if rain_in_hr >= 0.10:
        return RiskLevel.MODERATE
    return RiskLevel.LOW


def classify_snow(snow_in_hr: float) -> RiskLevel:
    """
    Snowfall Precipitation Thresholds:
    - Low: < 0.5 in/hr
    - Moderate: 0.5–1.0 in/hr
    - High: 1.0–2.0 in/hr
    - Severe: 2.0–3.0 in/hr
    - No Travel: > 3.0 in/hr
    """
    if snow_in_hr > 3.00:
        return RiskLevel.NO_TRAVEL
    if snow_in_hr >= 2.00:
        return RiskLevel.SEVERE
    if snow_in_hr >= 1.00:
        return RiskLevel.HIGH
    if snow_in_hr >= 0.50:
        return RiskLevel.MODERATE
    return RiskLevel.LOW


def evaluate_checkpoint_risk(
    wind_mph: float,
    rain_in_hr: float,
    snow_in_hr: float,
    load_weight_lbs: float
) -> CheckpointRiskAssessment:
    """
    Evaluates weather risk for a checkpoint.
    The overall risk is the maximum among wind (factoring in cargo weight rules), rain, and snow.
    """
    wind_risk = classify_wind(wind_mph, load_weight_lbs)
    rain_risk = classify_rain(rain_in_hr)
    snow_risk = classify_snow(snow_in_hr)

    overall = max(wind_risk, rain_risk, snow_risk)

    reasons: list[str] = []
    if wind_mph >= 55.0:
        reasons.append(f"Extreme wind ({wind_mph:.1f} mph ≥ 55 mph) triggers No Travel")
    elif 45.0 <= wind_mph < 55.0 and load_weight_lbs > 30000.0:
        reasons.append(f"Severe wind ({wind_mph:.1f} mph) with heavy load ({load_weight_lbs:,.0f} lbs > 30,000 lbs) triggers No Travel")
    elif 35.0 <= wind_mph < 45.0 and load_weight_lbs > 40000.0:
        reasons.append(f"High wind ({wind_mph:.1f} mph) with heavy load ({load_weight_lbs:,.0f} lbs > 40,000 lbs) escalated to Severe")

    if rain_in_hr > 1.0:
        reasons.append(f"Torrential rain ({rain_in_hr:.2f} in/hr > 1.00 in/hr) triggers No Travel")
    elif rain_risk >= RiskLevel.HIGH:
        reasons.append(f"Heavy rain ({rain_in_hr:.2f} in/hr)")

    if snow_in_hr > 3.0:
        reasons.append(f"Extreme snowfall/blizzard ({snow_in_hr:.2f} in/hr > 3.00 in/hr) triggers No Travel")
    elif snow_risk >= RiskLevel.HIGH:
        reasons.append(f"Heavy snowfall ({snow_in_hr:.2f} in/hr)")

    return CheckpointRiskAssessment(
        overall_risk=overall,
        wind_risk=wind_risk,
        rain_risk=rain_risk,
        snow_risk=snow_risk,
        wind_mph=wind_mph,
        rain_in_hr=rain_in_hr,
        snow_in_hr=snow_in_hr,
        load_weight_lbs=load_weight_lbs,
        reasons=reasons
    )
