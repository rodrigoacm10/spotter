import { useMemo } from 'react'
import type { CheckpointData, RiskLevel } from '@/shared/types'

const RISK_WEIGHTS: Record<RiskLevel, number> = {
  'No Travel': 4,
  Severe: 3,
  High: 2,
  Moderate: 1,
  Low: 0,
}

export interface RouteHazardsSummary {
  maxRisk: RiskLevel
  maxWind: number
  maxSnow: number
  maxRain: number
}

/**
 * Computes peak hazards (risk level, wind speed, snow, rain) across route checkpoints.
 */
export function useRouteHazards(checkpoints?: CheckpointData[]): RouteHazardsSummary {
  return useMemo(() => {
    let peakRisk: RiskLevel = 'Low'
    let peakWind = 0
    let peakSnow = 0
    let peakRain = 0

    if (!checkpoints || checkpoints.length === 0) {
      return {
        maxRisk: peakRisk,
        maxWind: peakWind,
        maxSnow: peakSnow,
        maxRain: peakRain,
      }
    }

    for (const checkpoint of checkpoints) {
      const currentWeight = RISK_WEIGHTS[checkpoint.risk.overall_risk] ?? 0
      const peakWeight = RISK_WEIGHTS[peakRisk] ?? 0

      if (currentWeight > peakWeight) {
        peakRisk = checkpoint.risk.overall_risk
      }
      if (checkpoint.weather.wind_mph > peakWind) {
        peakWind = checkpoint.weather.wind_mph
      }
      if (checkpoint.weather.snow_in_hr > peakSnow) {
        peakSnow = checkpoint.weather.snow_in_hr
      }
      if (checkpoint.weather.rain_in_hr > peakRain) {
        peakRain = checkpoint.weather.rain_in_hr
      }
    }

    return {
      maxRisk: peakRisk,
      maxWind: peakWind,
      maxSnow: peakSnow,
      maxRain: peakRain,
    }
  }, [checkpoints])
}
