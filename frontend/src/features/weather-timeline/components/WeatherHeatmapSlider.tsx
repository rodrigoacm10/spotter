import React, { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Slider,
  IconButton,
  Tooltip,
  Chip,
  Switch,
  FormControlLabel,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import LayersIcon from '@mui/icons-material/Layers'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import ScheduleIcon from '@mui/icons-material/Schedule'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'

import type { HeatmapMetric } from '@/shared/types'
import { useTimelinePlayback } from '../hooks/useTimelinePlayback'
import { formatForecastTime } from '@/shared/utils'
import { MetricLegendBar } from './MetricLegendBar'
import { WeatherSliderMinimized } from './WeatherSliderMinimized'
import { TimelineSegmentationBar } from './TimelineSegmentationBar'
import { WeatherControlsBar } from './WeatherControlsBar'

export type { HeatmapMetric }

export interface WeatherHeatmapSliderProps {
  currentHour: number
  onChangeHour: (hour: number | ((prev: number) => number)) => void
  metric: HeatmapMetric
  onChangeMetric: (metric: HeatmapMetric) => void
  showHeatmap: boolean
  onToggleShowHeatmap: (show: boolean) => void
  departureTime: string
  tripDurationHours?: number
}

const METRIC_LABELS: Record<HeatmapMetric, string> = {
  risk: 'Risk',
  wind: 'Wind',
  precipitation: 'Precipitation',
  temperature: 'Temp',
}

export const WeatherHeatmapSlider: React.FC<WeatherHeatmapSliderProps> = ({
  currentHour,
  onChangeHour,
  metric,
  onChangeMetric,
  showHeatmap,
  onToggleShowHeatmap,
  departureTime,
  tripDurationHours = 3.1,
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [isMinimized, setIsMinimized] = useState(false)

  const { isPlaying, togglePlay, resetToStart } = useTimelinePlayback({
    currentHour,
    onChangeHour,
    maxHour: 47,
    stepMs: 700,
  })

  const formattedForecastTime = formatForecastTime(departureTime, currentHour)
  const tripHours = Math.round(tripDurationHours * 10) / 10
  const isDuringTrip = currentHour <= tripHours
  const tripPercentage = Math.max(8, Math.min(92, (tripHours / 48) * 100))

  const marks = isMobile
    ? [
        { value: 0, label: '0h' },
        ...(tripHours > 2 && tripHours < 45 ? [{ value: Math.round(tripHours) }] : []),
        { value: 24, label: '+24h' },
        { value: 47, label: '+48h' },
      ]
    : [
        { value: 0, label: '0h' },
        ...(tripHours > 2 && tripHours < 45 ? [{ value: Math.round(tripHours) }] : []),
        { value: 12, label: '+12h' },
        { value: 24, label: '+24h' },
        { value: 36, label: '+36h' },
        { value: 47, label: '+48h' },
      ]

  if (isMinimized) {
    return (
      <WeatherSliderMinimized
        currentHour={currentHour}
        metric={metric}
        metricLabel={METRIC_LABELS[metric]}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        formattedForecastTime={formattedForecastTime}
        onExpand={() => setIsMinimized(false)}
      />
    )
  }

  return (
    <Paper
      elevation={5}
      sx={{
        position: 'relative',
        backgroundColor: 'rgba(15, 23, 42, 0.94)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        borderRadius: 3,
        p: { xs: 1.5, sm: 2 },
        width: '100%',
        maxWidth: 780,
        boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.7)',
        transition: 'all 0.25s ease',
      }}
    >
      <Tooltip title="Minimize Weather Controls (Hide)">
        <IconButton
          size="small"
          onClick={() => setIsMinimized(true)}
          aria-label="Hide weather controls"
          sx={{
            position: 'absolute',
            top: { xs: 10, sm: 12 },
            right: { xs: 10, sm: 12 },
            color: '#38bdf8',
            bgcolor: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.45)',
            boxShadow: '0 0 10px rgba(56, 189, 248, 0.25)',
            p: 0.6,
            zIndex: 2,
            transition: 'all 0.2s ease',
            '&:hover': {
              color: '#ffffff',
              bgcolor: 'rgba(56, 189, 248, 0.35)',
              borderColor: '#38bdf8',
              boxShadow: '0 0 14px rgba(56, 189, 248, 0.5)',
              transform: 'translateY(-1px)',
            },
          }}
        >
          <KeyboardArrowDownIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 6, mb: 1 }}>
        <LayersIcon sx={{ color: '#38bdf8', fontSize: { xs: 20, sm: 24 } }} />
        <Box>
          <Typography variant="subtitle2" fontWeight={700} sx={{ letterSpacing: 0.5, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            {isMobile ? 'Weather Heatmap (0–48h)' : 'Weather Corridor Heatmap (0–48h)'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Corridor weather evolution and dispatch windows
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.8, sm: 1.2 }, flexWrap: 'wrap', mb: 1.2, pr: { xs: 5, sm: 0 } }}>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={showHeatmap}
              onChange={(event) => onToggleShowHeatmap(event.target.checked)}
              color="primary"
            />
          }
          label={
            <Typography variant="caption" fontWeight={600} color={showHeatmap ? 'primary.light' : 'text.secondary'} sx={{ fontSize: '0.7rem' }}>
              {isMobile ? 'Heatmap' : 'Heatmap Layer'}
            </Typography>
          }
          sx={{ mr: 0 }}
        />

        <Chip
          icon={
            isDuringTrip ? (
              <LocalShippingIcon sx={{ fontSize: '13px !important', color: '#10b981 !important' }} />
            ) : (
              <ScheduleIcon sx={{ fontSize: '13px !important', color: '#38bdf8 !important' }} />
            )
          }
          label={
            isDuringTrip
              ? (isMobile ? `En Route +${currentHour}h` : `In Transit: +${currentHour}h (~${tripHours}h)`)
              : (isMobile ? `+${currentHour}h Future` : `Post-Arrival: +${currentHour}h`)
          }
          size="small"
          sx={{
            bgcolor: isDuringTrip ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
            color: isDuringTrip ? '#34d399' : '#7dd3fc',
            border: `1px solid ${isDuringTrip ? 'rgba(16, 185, 129, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`,
            fontWeight: 700,
            fontSize: '0.68rem',
            height: 24,
          }}
        />

        <Chip
          label={formattedForecastTime}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.68rem', height: 24, display: { xs: 'none', sm: 'inline-flex' } }}
        />
      </Box>

      <WeatherControlsBar
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onResetToStart={resetToStart}
        metric={metric}
        onChangeMetric={onChangeMetric}
      />

      <MetricLegendBar metric={metric} />

      <TimelineSegmentationBar
        tripHours={tripHours}
        tripPercentage={tripPercentage}
        isMobile={isMobile}
        onSelectHour={(hour) => onChangeHour(hour)}
      />

      <Box sx={{ px: 1 }}>
        <Slider
          value={currentHour}
          min={0}
          max={47}
          step={1}
          onChange={(_, selectedHour) => onChangeHour(selectedHour as number)}
          marks={marks}
          valueLabelDisplay="auto"
          valueLabelFormat={(hourValue) => `+${hourValue}h`}
          sx={{
            color: isDuringTrip ? '#10b981' : '#38bdf8',
            height: 6,
            '& .MuiSlider-thumb': {
              width: 18,
              height: 18,
              boxShadow: isDuringTrip
                ? '0 0 10px rgba(16, 185, 129, 0.8)'
                : '0 0 10px rgba(56, 189, 248, 0.8)',
              '&:hover, &.Mui-focusVisible': {
                boxShadow: isDuringTrip
                  ? '0 0 16px rgba(16, 185, 129, 1)'
                  : '0 0 16px rgba(56, 189, 248, 1)',
              },
            },
            '& .MuiSlider-markLabel': {
              color: 'text.secondary',
              fontSize: '0.7rem',
              fontWeight: 500,
            },
            '& .MuiSlider-rail': {
              bgcolor: 'rgba(255, 255, 255, 0.15)',
            },
          }}
        />
      </Box>
    </Paper>
  )
}
