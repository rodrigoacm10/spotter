import React from 'react'
import { Paper, Box, Typography, Chip, Tooltip, IconButton, Button } from '@mui/material'
import LayersIcon from '@mui/icons-material/Layers'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import type { HeatmapMetric } from '@/shared/types'

interface WeatherSliderMinimizedProps {
  currentHour: number
  metric: HeatmapMetric
  metricLabel: string
  isPlaying: boolean
  onTogglePlay: () => void
  formattedForecastTime: string
  onExpand: () => void
}

export const WeatherSliderMinimized: React.FC<WeatherSliderMinimizedProps> = ({
  currentHour,
  metricLabel,
  isPlaying,
  onTogglePlay,
  formattedForecastTime,
  onExpand,
}) => {
  return (
    <Paper
      elevation={6}
      sx={{
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: 3,
        px: { xs: 1.5, sm: 2 },
        py: 0.8,
        width: '100%',
        maxWidth: 780,
        boxShadow: '0 12px 24px -6px rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, overflow: 'hidden' }}>
        <LayersIcon sx={{ color: '#38bdf8', fontSize: 18, flexShrink: 0 }} />
        <Typography
          variant="body2"
          fontWeight={700}
          noWrap
          sx={{ fontSize: { xs: '0.78rem', sm: '0.85rem' }, color: '#f8fafc' }}
        >
          Weather: +{currentHour}h
        </Typography>
        <Chip
          label={metricLabel}
          size="small"
          sx={{
            height: 20,
            fontSize: '0.68rem',
            bgcolor: 'rgba(56, 189, 248, 0.15)',
            color: '#38bdf8',
            fontWeight: 600,
            display: { xs: 'none', sm: 'inline-flex' },
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
        <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
          <IconButton
            size="small"
            onClick={onTogglePlay}
            sx={{
              p: 0.5,
              bgcolor: isPlaying ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)',
              color: isPlaying ? '#ef4444' : '#38bdf8',
            }}
          >
            {isPlaying ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
          </IconButton>
        </Tooltip>

        <Chip
          label={formattedForecastTime}
          size="small"
          variant="outlined"
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.68rem',
            height: 22,
            maxWidth: { xs: 120, sm: 'none' },
          }}
        />
      </Box>

      <Button
        size="small"
        variant="contained"
        endIcon={<KeyboardArrowUpIcon fontSize="small" />}
        onClick={onExpand}
        sx={{
          py: 0.3,
          px: { xs: 1, sm: 1.5 },
          fontSize: { xs: '0.7rem', sm: '0.75rem' },
          fontWeight: 700,
          bgcolor: 'rgba(56, 189, 248, 0.2)',
          color: '#38bdf8',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          boxShadow: 'none',
          whiteSpace: 'nowrap',
          '&:hover': {
            bgcolor: 'rgba(56, 189, 248, 0.3)',
            boxShadow: 'none',
          },
        }}
      >
        Expand
      </Button>
    </Paper>
  )
}
