import type { AnalyzedRoute, CheckpointData, HeatmapMetric } from '@/shared/types'
import { RISK_COLORS } from '@/shared/theme'

export interface GeoJSONFeatureCollection<P = Record<string, unknown>> {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    properties: P
    geometry: {
      type: string
      coordinates: unknown
    }
  }>
}

/**
 * Calculates the bounding box of a list of coordinates [[minLon, minLat], [maxLon, maxLat]].
 */
export function calculateRouteBounds(
  coordinates: [number, number][]
): [[number, number], [number, number]] | null {
  if (!coordinates || coordinates.length === 0) return null

  let minLongitude = coordinates[0][0]
  let maxLongitude = coordinates[0][0]
  let minLatitude = coordinates[0][1]
  let maxLatitude = coordinates[0][1]

  for (const [longitude, latitude] of coordinates) {
    if (longitude < minLongitude) minLongitude = longitude
    if (longitude > maxLongitude) maxLongitude = longitude
    if (latitude < minLatitude) minLatitude = latitude
    if (latitude > maxLatitude) maxLatitude = latitude
  }

  return [
    [minLongitude, minLatitude],
    [maxLongitude, maxLatitude],
  ]
}

/**
 * GeoJSON for alternative / inactive routes.
 */
export function buildInactiveRoutesGeoJSON(
  routes: AnalyzedRoute[],
  activeRouteId: string | null
): GeoJSONFeatureCollection {
  const features = routes
    .filter((route) => route.id !== activeRouteId)
    .map((route) => ({
      type: 'Feature' as const,
      properties: {
        id: route.id,
        summary: route.summary,
        rank: route.rank,
      },
      geometry: route.geometry,
    }))

  return {
    type: 'FeatureCollection',
    features,
  }
}

/**
 * GeoJSON for the active selected route line and glow.
 */
export function buildActiveRouteGeoJSON(
  activeRoute: AnalyzedRoute | null
): GeoJSONFeatureCollection {
  if (!activeRoute) {
    return { type: 'FeatureCollection', features: [] }
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature' as const,
        properties: {
          id: activeRoute.id,
          summary: activeRoute.summary,
          isRecommended: activeRoute.is_recommended,
        },
        geometry: activeRoute.geometry,
      },
    ],
  }
}

/**
 * GeoJSON for the checkpoints along the active route.
 */
export function buildCheckpointsGeoJSON(
  activeRoute: AnalyzedRoute | null
): GeoJSONFeatureCollection {
  if (!activeRoute?.checkpoints) {
    return { type: 'FeatureCollection', features: [] }
  }

  const features = activeRoute.checkpoints.map((checkpoint) => ({
    type: 'Feature' as const,
    properties: {
      index: checkpoint.index,
      mile: checkpoint.mile,
      overall_risk: checkpoint.risk.overall_risk,
      overall_risk_value: checkpoint.risk.overall_risk_value,
      color: RISK_COLORS[checkpoint.risk.overall_risk] || '#10B981',
      wind_mph: checkpoint.weather.wind_mph,
      rain_in_hr: checkpoint.weather.rain_in_hr,
      snow_in_hr: checkpoint.weather.snow_in_hr,
      temperature: checkpoint.weather.temperature,
      eta: checkpoint.eta,
      reasons: (checkpoint.risk.reasons || []).join('; '),
    },
    geometry: {
      type: 'Point' as const,
      coordinates: [checkpoint.longitude, checkpoint.latitude],
    },
  }))

  return {
    type: 'FeatureCollection',
    features,
  }
}

/**
 * Calculates the normalized heatmap density weight (0.0 to 1.0) based on metric and load weight.
 */
export function calculateHeatmapWeight(
  weather: { wind_mph?: number; rain_in_hr?: number; snow_in_hr?: number; temperature?: number },
  metric: HeatmapMetric,
  loadWeightLbs: number
): number {
  if (metric === 'risk') {
    const wind = weather.wind_mph || 0
    const rain = weather.rain_in_hr || 0
    const snow = weather.snow_in_hr || 0

    if (wind >= 55 || (wind >= 45 && loadWeightLbs > 30000)) {
      return 1.0 // No Travel
    } else if (wind >= 45 || (wind >= 35 && loadWeightLbs > 40000) || rain >= 0.5 || snow >= 2.0) {
      return 0.85 // Severe
    } else if (wind >= 35 || rain >= 0.25 || snow >= 1.0) {
      return 0.65 // High
    } else if (wind >= 25 || rain >= 0.1 || snow >= 0.5) {
      return 0.45 // Moderate
    } else {
      return 0.15 // Low
    }
  }

  if (metric === 'wind') {
    const wind = weather.wind_mph || 0
    if (wind < 15) return 0.05
    if (wind >= 55) return 1.0
    if (wind >= 45) return 0.85 + Math.min(0.15, ((wind - 45) / 10) * 0.15)
    if (wind >= 35) return 0.65 + ((wind - 35) / 10) * 0.18
    if (wind >= 25) return 0.45 + ((wind - 25) / 10) * 0.18
    return 0.15 + ((wind - 15) / 10) * 0.25
  }

  if (metric === 'precipitation') {
    const totalPrecip = (weather.rain_in_hr || 0) + (weather.snow_in_hr || 0)
    if (totalPrecip <= 0.01) return 0.0
    if (totalPrecip >= 0.5) return Math.min(1.0, 0.85 + ((totalPrecip - 0.5) / 0.5) * 0.15)
    if (totalPrecip >= 0.25) return 0.65 + ((totalPrecip - 0.25) / 0.25) * 0.18
    if (totalPrecip >= 0.1) return 0.45 + ((totalPrecip - 0.1) / 0.15) * 0.18
    return 0.15 + (totalPrecip / 0.1) * 0.25
  }

  if (metric === 'temperature') {
    const temp = weather.temperature ?? 70
    return Math.min(1.0, Math.max(0.05, (temp - 10) / 95.0))
  }

  return 0.1
}

/**
 * GeoJSON for the corridor heatmap based on current hour offset and metric.
 */
export function buildHeatmapGeoJSON(
  activeRoute: AnalyzedRoute | null,
  currentHour: number,
  metric: HeatmapMetric,
  loadWeightLbs: number
): GeoJSONFeatureCollection {
  if (!activeRoute?.checkpoints) {
    return { type: 'FeatureCollection', features: [] }
  }

  const features = activeRoute.checkpoints.map((checkpoint: CheckpointData) => {
    const timelineItem =
      checkpoint.hourly_timeline && checkpoint.hourly_timeline[currentHour]
        ? checkpoint.hourly_timeline[currentHour]
        : {
            wind_mph: checkpoint.weather.wind_mph,
            rain_in_hr: checkpoint.weather.rain_in_hr,
            snow_in_hr: checkpoint.weather.snow_in_hr,
            temperature: checkpoint.weather.temperature,
          }

    const weight = calculateHeatmapWeight(timelineItem, metric, loadWeightLbs)

    return {
      type: 'Feature' as const,
      properties: {
        weight,
        index: checkpoint.index,
        mile: checkpoint.mile,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [checkpoint.longitude, checkpoint.latitude],
      },
    }
  })

  return {
    type: 'FeatureCollection',
    features,
  }
}
