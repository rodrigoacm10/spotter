import React from 'react'
import { Box, Typography, Tooltip } from '@mui/material'
import type { RouteMetrics, RiskLevel } from '@/shared/types'
import { RISK_COLORS } from '@/shared/theme'

export interface RouteRiskBarProps {
  metrics: RouteMetrics
  totalDistance: number
}

interface RiskSegmentConfig {
  key: keyof RouteMetrics
  label: string
  riskLevel: RiskLevel
}

const RISK_SEGMENTS: readonly RiskSegmentConfig[] = [
  { key: 'low_miles', label: 'Low Risk', riskLevel: 'Low' },
  { key: 'moderate_miles', label: 'Moderate Risk', riskLevel: 'Moderate' },
  { key: 'high_miles', label: 'High Risk', riskLevel: 'High' },
  { key: 'severe_miles', label: 'Severe Risk', riskLevel: 'Severe' },
  { key: 'no_travel_miles', label: 'No Travel', riskLevel: 'No Travel' },
] as const

export const RouteRiskBar: React.FC<RouteRiskBarProps> = ({
  metrics,
  totalDistance,
}) => {
  const safeDistance = totalDistance > 0 ? totalDistance : 1
  const percentageLow = (((metrics.low_miles || 0) / safeDistance) * 100)

  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          Corridor Risk Distribution:
        </Typography>
        <Typography variant="caption" fontWeight={600} sx={{ color: '#38bdf8', fontSize: '0.7rem' }}>
          {percentageLow.toFixed(0)}% Safe
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          height: 7,
          borderRadius: 4,
          overflow: 'hidden',
          bgcolor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        {RISK_SEGMENTS.map(({ key, label, riskLevel }) => {
          const miles = (metrics[key] as number) || 0
          const segmentPercentage = (miles / safeDistance) * 100

          if (segmentPercentage <= 0) return null

          return (
            <Tooltip
              key={key}
              title={`${label}: ${miles.toFixed(1)} mi (${segmentPercentage.toFixed(0)}%)`}
            >
              <Box
                sx={{
                  width: `${segmentPercentage}%`,
                  bgcolor: RISK_COLORS[riskLevel],
                }}
              />
            </Tooltip>
          )
        })}
      </Box>
    </Box>
  )
}
