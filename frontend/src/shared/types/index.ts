export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Severe' | 'No Travel'

export interface LocationOption {
  display_name: string
  latitude: number
  longitude: number
  type?: string
}

export interface AnalyzeTripParams {
  origin_lat: number
  origin_lon: number
  dest_lat: number
  dest_lon: number
  departure_time: string
  load_weight_lbs: number
  sample_interval_miles: number
}

export interface CheckpointWeather {
  forecast_time: string
  wind_mph: number
  rain_in_hr: number
  snow_in_hr: number
  temperature: number
}

export interface CheckpointRisk {
  overall_risk: RiskLevel
  overall_risk_value: number
  color: string
  wind_risk: RiskLevel
  rain_risk: RiskLevel
  snow_risk: RiskLevel
  wind_mph: number
  rain_in_hr: number
  snow_in_hr: number
  reasons: string[]
}

export interface HourlyTimelineItem {
  hour_offset: number
  time: string
  wind_mph: number
  rain_in_hr: number
  snow_in_hr: number
  temperature: number
}

export interface CheckpointData {
  index: number
  mile: number
  latitude: number
  longitude: number
  eta: string
  weather: CheckpointWeather
  risk: CheckpointRisk
  hourly_timeline: HourlyTimelineItem[]
}

export interface RouteMetrics {
  low_miles: number
  moderate_miles: number
  high_miles: number
  severe_miles: number
  no_travel_miles: number
  average_risk_score: number
  has_no_travel: boolean
  total_checkpoints: number
}

export interface AnalyzedRoute {
  id: string
  summary: string
  distance_miles: number
  duration_hours: number
  duration_seconds: number
  geometry: {
    type: 'LineString'
    coordinates: [number, number][]
  }
  checkpoints: CheckpointData[]
  metrics: RouteMetrics
  is_recommended: boolean
  rank: number
  recommendation_reason: string
}

export interface TripAnalysisResponse {
  origin: {
    latitude: number
    longitude: number
  }
  destination: {
    latitude: number
    longitude: number
  }
  departure_time: string
  load_weight_lbs: number
  sample_interval_miles: number
  routes: AnalyzedRoute[]
}

export type HeatmapMetric = 'risk' | 'wind' | 'precipitation' | 'temperature'
