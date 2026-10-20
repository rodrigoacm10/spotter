export interface DemoPreset {
  id: string
  name: string
  subtitle: string
  originName: string
  originLat: number
  originLon: number
  destName: string
  destLat: number
  destLon: number
  loadWeightLbs: number
  sampleInterval: number
  tag: string
  tagColor: 'primary' | 'secondary' | 'warning' | 'error' | 'info' | 'success'
}

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: 'miami-keywest',
    name: 'Miami → Key West (Severe Rain)',
    subtitle: 'Tropical storm downpour >1.0 in/hr triggering No Travel safety condition',
    originName: 'Miami, FL',
    originLat: 25.7617,
    originLon: -80.1918,
    destName: 'Key West, FL',
    destLat: 24.5551,
    destLon: -81.7800,
    loadWeightLbs: 42000,
    sampleInterval: 25,
    tag: 'Torrential Rain (No Travel)',
    tagColor: 'error',
  },
  {
    id: 'calgary-lethbridge',
    name: 'Calgary → Lethbridge (35+ mph Winds)',
    subtitle: 'High crosswinds (>35 mph) with heavy cargo (>40k lbs) escalating to Severe',
    originName: 'Calgary, AB',
    originLat: 51.0447,
    originLon: -114.0719,
    destName: 'Lethbridge, AB',
    destLat: 49.6956,
    destLon: -112.8451,
    loadWeightLbs: 43500,
    sampleInterval: 25,
    tag: 'Wind + Heavy Load (Severe)',
    tagColor: 'warning',
  },
  {
    id: 'chicago-indy',
    name: 'Chicago → Indianapolis',
    subtitle: 'Standard Midwest freight corridor with 3 highway options under fair weather',
    originName: 'Chicago, IL',
    originLat: 41.8781,
    originLon: -87.6298,
    destName: 'Indianapolis, IN',
    destLat: 39.7684,
    destLon: -86.1581,
    loadWeightLbs: 35000,
    sampleInterval: 25,
    tag: 'Standard (Fair Weather)',
    tagColor: 'primary',
  },
  {
    id: 'heavy-rockies',
    name: 'Denver → Salt Lake City',
    subtitle: 'Rocky Mountains crossing testing heavy cargo (>40k lbs) and high elevation',
    originName: 'Denver, CO',
    originLat: 39.7392,
    originLon: -104.9903,
    destName: 'Salt Lake City, UT',
    destLat: 40.7608,
    destLon: -111.891,
    loadWeightLbs: 43500,
    sampleInterval: 25,
    tag: 'Heavy Load (43.5k lbs)',
    tagColor: 'secondary',
  },
  {
    id: 'seattle-portland',
    name: 'Seattle → Portland',
    subtitle: 'Pacific Northwest I-5 corridor with high-density 10-mile checkpoint sampling',
    originName: 'Seattle, WA',
    originLat: 47.6062,
    originLon: -122.3321,
    destName: 'Portland, OR',
    destLat: 45.5152,
    destLon: -122.6784,
    loadWeightLbs: 24000,
    sampleInterval: 10,
    tag: 'High Resolution (10mi)',
    tagColor: 'info',
  },
]
