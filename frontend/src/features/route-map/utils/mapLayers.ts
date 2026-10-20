import type { HeatmapMetric } from '@/shared/types'

export const MAP_STYLES = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
}

// Safety Risk Palette: Green -> Amber -> Orange -> Red -> Crimson
export const RISK_HEATMAP_COLOR = [
  'interpolate',
  ['linear'],
  ['heatmap-density'],
  0,
  'rgba(0, 0, 0, 0)',
  0.1,
  'rgba(16, 185, 129, 0.45)', // Green (Low)
  0.3,
  'rgba(16, 185, 129, 0.8)',
  0.48,
  'rgba(245, 158, 11, 0.88)', // Amber (Moderate)
  0.68,
  'rgba(249, 115, 22, 0.94)', // Orange (High)
  0.85,
  'rgba(239, 68, 68, 0.96)', // Red (Severe)
  1.0,
  'rgba(127, 29, 29, 0.98)', // Deep crimson (No Travel)
]

// Wind Speed Palette: Calm Green -> Amber -> High Orange -> Severe Red -> Critical Purple
export const WIND_HEATMAP_COLOR = [
  'interpolate',
  ['linear'],
  ['heatmap-density'],
  0,
  'rgba(0, 0, 0, 0)',
  0.12,
  'rgba(16, 185, 129, 0.45)', // Green (<25 mph)
  0.4,
  'rgba(245, 158, 11, 0.85)', // Amber (25-35 mph)
  0.62,
  'rgba(249, 115, 22, 0.92)', // Orange (35-45 mph)
  0.82,
  'rgba(239, 68, 68, 0.96)', // Red (45-55 mph)
  1.0,
  'rgba(168, 85, 247, 0.98)', // Purple (≥55 mph No Travel)
]

// Precipitation Radar Palette: Light Blue -> Green -> Yellow -> Orange -> Torrential Red
export const PRECIP_HEATMAP_COLOR = [
  'interpolate',
  ['linear'],
  ['heatmap-density'],
  0,
  'rgba(0, 0, 0, 0)',
  0.12,
  'rgba(56, 189, 248, 0.6)', // Light Blue (<0.1 in/hr Light rain)
  0.35,
  'rgba(16, 185, 129, 0.85)', // Green (0.1 in/hr)
  0.58,
  'rgba(234, 179, 8, 0.9)', // Yellow (0.25 in/hr)
  0.78,
  'rgba(249, 115, 22, 0.95)', // Orange (0.4 in/hr)
  0.9,
  'rgba(239, 68, 68, 0.98)', // Red (≥0.5 in/hr Severe)
  1.0,
  'rgba(127, 29, 29, 0.98)', // Deep crimson
]

// Temperature Thermal Palette: Deep Blue (<20°F) -> Ice Cyan (32°F) -> Teal (50°F) -> Green (65°F) -> Yellow (78°F) -> Amber/Orange (88°F) -> Red (≥100°F)
export const TEMP_HEATMAP_COLOR = [
  'interpolate',
  ['linear'],
  ['heatmap-density'],
  0,
  'rgba(0, 0, 0, 0)',
  0.1,
  'rgba(30, 64, 175, 0.8)', // Deep Blue (< 20°F Freezing)
  0.25,
  'rgba(56, 189, 248, 0.85)', // Cyan / Ice (~32°F Freezing point)
  0.42,
  'rgba(20, 184, 166, 0.85)', // Teal (~50°F Chilly)
  0.58,
  'rgba(34, 197, 94, 0.85)', // Green (~65°F Mild/Comfortable)
  0.72,
  'rgba(234, 179, 8, 0.9)', // Yellow / Gold (~78°F Warm)
  0.85,
  'rgba(249, 115, 22, 0.95)', // Orange / Amber (~88°F Very hot)
  1.0,
  'rgba(239, 68, 68, 0.98)', // Red (≥100°F Extreme heat)
]

export function getHeatmapColorByMetric(metric: HeatmapMetric) {
  switch (metric) {
    case 'temperature':
      return TEMP_HEATMAP_COLOR
    case 'precipitation':
      return PRECIP_HEATMAP_COLOR
    case 'wind':
      return WIND_HEATMAP_COLOR
    case 'risk':
    default:
      return RISK_HEATMAP_COLOR
  }
}
