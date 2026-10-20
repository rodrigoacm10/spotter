import React from 'react'
import { Box, Chip, Tooltip } from '@mui/material'

export interface RouteHazardChipsProps {
  maxWind: number
  maxSnow: number
  maxRain: number
}

export const RouteHazardChips: React.FC<RouteHazardChipsProps> = ({
  maxWind,
  maxSnow,
  maxRain,
}) => {
  const isHighWind = maxWind >= 35

  return (
    <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap', mb: 1.2 }}>
      <Tooltip title="Peak wind speed recorded along the route">
        <Chip
          size="small"
          label={`💨 Max Wind: ${maxWind.toFixed(0)} mph`}
          sx={{
            fontSize: '0.68rem',
            bgcolor: isHighWind ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.06)',
            color: isHighWind ? '#fca5a5' : 'text.secondary',
            height: 22,
          }}
        />
      </Tooltip>

      {maxSnow > 0 && (
        <Tooltip title="Peak hourly snowfall along the route">
          <Chip
            size="small"
            label={`❄️ Snow: ${maxSnow.toFixed(1)} in/h`}
            sx={{
              fontSize: '0.68rem',
              bgcolor: 'rgba(56, 189, 248, 0.15)',
              color: '#7dd3fc',
              height: 22,
            }}
          />
        </Tooltip>
      )}

      {maxRain > 0 && (
        <Tooltip title="Peak hourly rainfall along the route">
          <Chip
            size="small"
            label={`🌧️ Rain: ${maxRain.toFixed(2)} in/h`}
            sx={{
              fontSize: '0.68rem',
              bgcolor: 'rgba(56, 189, 248, 0.15)',
              color: '#7dd3fc',
              height: 22,
            }}
          />
        </Tooltip>
      )}
    </Box>
  )
}
