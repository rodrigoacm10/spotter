import type { RiskLevel } from '@/shared/types'
import { RISK_COLORS } from '@/shared/theme'

export interface ThresholdRow {
  condition: string
  low: string
  moderate: string
  high: string
  severe: string
  noTravel: string
}

export const METEOROLOGICAL_THRESHOLDS: readonly ThresholdRow[] = [
  {
    condition: 'Wind Speed (mph)',
    low: '< 25 mph',
    moderate: '25 – 34',
    high: '35 – 44',
    severe: '45 – 54',
    noTravel: '≥ 55 mph',
  },
  {
    condition: 'Rain (in/hr)',
    low: '< 0.10 in/hr',
    moderate: '0.10 – 0.25',
    high: '0.25 – 0.50',
    severe: '0.50 – 1.00',
    noTravel: '> 1.00 in/hr',
  },
  {
    condition: 'Snowfall (in/hr)',
    low: '< 0.5 in/hr',
    moderate: '0.5 – 1.0',
    high: '1.0 – 2.0',
    severe: '2.0 – 3.0',
    noTravel: '> 3.0 in/hr',
  },
] as const

export interface CargoRuleItem {
  conditionText: string
  chipLabel: string
  riskLevel: RiskLevel
  borderColor: string
  bgColor: string
}

export const CARGO_LOAD_RULES: readonly CargoRuleItem[] = [
  {
    conditionText: 'Wind ≥ 55 mph (any cargo weight)',
    chipLabel: 'NO TRAVEL',
    riskLevel: 'No Travel',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    bgColor: 'rgba(127, 29, 29, 0.2)',
  },
  {
    conditionText: 'Wind 45–54 mph + Cargo > 30,000 lbs',
    chipLabel: 'NO TRAVEL (Escalated from Severe)',
    riskLevel: 'No Travel',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    bgColor: 'rgba(127, 29, 29, 0.2)',
  },
  {
    conditionText: 'Wind 35–44 mph + Cargo > 40,000 lbs',
    chipLabel: 'SEVERE (Escalated from High)',
    riskLevel: 'Severe',
    borderColor: 'rgba(249, 115, 22, 0.4)',
    bgColor: 'rgba(239, 68, 68, 0.15)',
  },
] as const

export const RECOMMENDATION_CRITERIA: readonly { title: string; highlight?: boolean }[] = [
  { title: 'Routes without "No Travel": impassable segments always disqualify a route', highlight: true },
  { title: '1. Fewest miles under Severe conditions' },
  { title: '2. Fewest miles under High conditions' },
  { title: '3. Lowest weighted average risk score' },
  { title: '4. Shortest estimated travel duration' },
] as const

export const RISK_LEVEL_COLUMNS: readonly { label: RiskLevel; color: string }[] = [
  { label: 'Low', color: RISK_COLORS.Low },
  { label: 'Moderate', color: RISK_COLORS.Moderate },
  { label: 'High', color: RISK_COLORS.High },
  { label: 'Severe', color: RISK_COLORS.Severe },
  { label: 'No Travel', color: RISK_COLORS['No Travel'] },
] as const
