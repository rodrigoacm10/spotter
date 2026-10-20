import React from 'react'
import { Box, Typography } from '@mui/material'
import type { HeatmapMetric } from '@/shared/types'

interface MetricLegendBarProps {
  metric: HeatmapMetric
}

interface LegendItemConfig {
  dotColor?: string
  textColor: string
  label: string
}

const LEGEND_ITEMS: Record<HeatmapMetric, LegendItemConfig[]> = {
  temperature: [
    { dotColor: '#1e40af', textColor: '#93c5fd', label: '<20°F Freezing' },
    { dotColor: '#38bdf8', textColor: '#7dd3fc', label: '32°F Cold' },
    { dotColor: '#22c55e', textColor: '#86efac', label: '65°F Mild' },
    { dotColor: '#eab308', textColor: '#fde047', label: '78°F Warm' },
    { dotColor: '#f97316', textColor: '#fdba74', label: '88°F Hot' },
    { dotColor: '#ef4444', textColor: '#fca5a5', label: '>100°F Extreme' },
  ],
  risk: [
    { dotColor: '#10b981', textColor: '#6ee7b7', label: 'Low (Safe)' },
    { dotColor: '#f59e0b', textColor: '#fcd34d', label: 'Moderate' },
    { dotColor: '#f97316', textColor: '#fdba74', label: 'High' },
    { dotColor: '#ef4444', textColor: '#fca5a5', label: 'Severe' },
    { dotColor: '#7f1d1d', textColor: '#fca5a5', label: 'No Travel' },
  ],
  wind: [
    { dotColor: '#10b981', textColor: '#6ee7b7', label: '<25 mph Calm' },
    { dotColor: '#f59e0b', textColor: '#fcd34d', label: '25–35 mph' },
    { dotColor: '#f97316', textColor: '#fdba74', label: '35–45 mph' },
    { dotColor: '#ef4444', textColor: '#fca5a5', label: '45–55 mph Severe' },
    { dotColor: '#a855f7', textColor: '#d8b4fe', label: '≥55 mph Critical' },
  ],
  precipitation: [
    { textColor: '#94a3b8', label: 'No Rain' },
    { dotColor: '#38bdf8', textColor: '#7dd3fc', label: '<0.1" Light' },
    { dotColor: '#10b981', textColor: '#6ee7b7', label: '0.1–0.25"' },
    { dotColor: '#eab308', textColor: '#fde047', label: '0.25–0.5"' },
    { dotColor: '#ef4444', textColor: '#fca5a5', label: '≥0.5" Heavy' },
  ],
}

export const MetricLegendBar: React.FC<MetricLegendBarProps> = ({ metric }) => {
  const items = LEGEND_ITEMS[metric] ?? []

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: { xs: 'flex-start', sm: 'space-between' },
        px: { xs: 0.8, sm: 1.2 },
        py: 0.6,
        mb: 1.2,
        bgcolor: 'rgba(0, 0, 0, 0.35)',
        borderRadius: 2,
        border: '1px solid rgba(255, 255, 255, 0.06)',
        flexWrap: 'wrap',
        gap: { xs: 0.6, sm: 1 },
      }}
    >
      {items.map((legendItem) => (
        <Box key={legendItem.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          {legendItem.dotColor && (
            <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: legendItem.dotColor }} />
          )}
          <Typography variant="caption" sx={{ fontSize: '0.68rem', color: legendItem.textColor }}>
            {legendItem.label}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}
