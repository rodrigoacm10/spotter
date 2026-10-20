import React from 'react'
import {
  Box,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import FastRewindIcon from '@mui/icons-material/FastRewind'
import AirIcon from '@mui/icons-material/Air'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import ThermostatIcon from '@mui/icons-material/Thermostat'
import ShieldAlertIcon from '@mui/icons-material/Security'

import type { HeatmapMetric } from '@/shared/types'

const METRIC_BUTTONS: Array<{
  value: HeatmapMetric
  label: string
  icon: React.ReactElement
}> = [
  { value: 'risk', label: 'Risk', icon: <ShieldAlertIcon sx={{ fontSize: 14 }} /> },
  { value: 'wind', label: 'Wind', icon: <AirIcon sx={{ fontSize: 14 }} /> },
  { value: 'precipitation', label: 'Rain/Snow', icon: <WaterDropIcon sx={{ fontSize: 14 }} /> },
  { value: 'temperature', label: 'Temp', icon: <ThermostatIcon sx={{ fontSize: 14 }} /> },
]

interface WeatherControlsBarProps {
  isPlaying: boolean
  onTogglePlay: () => void
  onResetToStart: () => void
  metric: HeatmapMetric
  onChangeMetric: (metric: HeatmapMetric) => void
}

export const WeatherControlsBar: React.FC<WeatherControlsBarProps> = ({
  isPlaying,
  onTogglePlay,
  onResetToStart,
  metric,
  onChangeMetric,
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2, flexWrap: 'wrap', gap: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title="Reset to start (0h - Departure)">
          <IconButton size="small" onClick={onResetToStart} sx={{ color: 'text.secondary' }}>
            <FastRewindIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={isPlaying ? 'Pause simulation' : 'Start auto-playback (0–48h)'}>
          <IconButton
            size="small"
            onClick={onTogglePlay}
            sx={{
              bgcolor: isPlaying ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)',
              color: isPlaying ? '#ef4444' : '#38bdf8',
              '&:hover': {
                bgcolor: isPlaying ? 'rgba(239, 68, 68, 0.3)' : 'rgba(56, 189, 248, 0.3)',
              },
            }}
          >
            {isPlaying ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      <ToggleButtonGroup
        value={metric}
        exclusive
        onChange={(_, selectedMetric) => {
          if (selectedMetric) onChangeMetric(selectedMetric)
        }}
        size="small"
        sx={{
          bgcolor: 'rgba(0, 0, 0, 0.3)',
          borderRadius: 2,
          '& .MuiToggleButton-root': {
            border: 'none',
            px: 1.5,
            py: 0.4,
            fontSize: '0.75rem',
            color: 'text.secondary',
            '&.Mui-selected': {
              bgcolor: 'rgba(56, 189, 248, 0.2)',
              color: '#38bdf8',
              fontWeight: 700,
            },
          },
        }}
      >
        {METRIC_BUTTONS.map((metricButton) => (
          <ToggleButton key={metricButton.value} value={metricButton.value}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {metricButton.icon} {metricButton.label}
            </Box>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  )
}
