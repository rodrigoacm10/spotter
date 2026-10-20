import React from 'react'
import { Box, Typography, Tooltip } from '@mui/material'

interface TimelineSegmentationBarProps {
  tripHours: number
  tripPercentage: number
  isMobile: boolean
  onSelectHour: (hour: number) => void
}

export const TimelineSegmentationBar: React.FC<TimelineSegmentationBarProps> = ({
  tripHours,
  tripPercentage,
  isMobile,
  onSelectHour,
}) => {
  return (
    <Box sx={{ mb: 1, px: 0.5 }}>
      <Box
        sx={{
          display: 'flex',
          height: 22,
          borderRadius: 1.5,
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
        }}
      >
        <Tooltip title={`Estimated trip duration: ${tripHours} hours. The truck is en route during this window.`}>
          <Box
            sx={{
              width: `${tripPercentage}%`,
              bgcolor: 'rgba(16, 185, 129, 0.25)',
              borderRight: '2px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: 1,
              cursor: 'pointer',
            }}
            onClick={() => onSelectHour(Math.round(tripHours / 2))}
          >
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: '#34d399',
                fontWeight: 700,
                fontSize: '0.68rem',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              {isMobile || tripPercentage < 22 ? `🚚 ~${tripHours}h` : `🚚 Trip: 0h – ~${tripHours}h`}
            </Typography>
          </Box>
        </Tooltip>

        <Tooltip title="Extended forecast up to 48 hours. Allows planning return trips or delaying departure during adverse weather.">
          <Box
            sx={{
              flex: 1,
              bgcolor: 'rgba(56, 189, 248, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: 1,
              cursor: 'pointer',
            }}
            onClick={() => onSelectHour(24)}
          >
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: '#94a3b8',
                fontWeight: 500,
                fontSize: '0.68rem',
              }}
            >
              {isMobile || tripPercentage > 65 ? '🔮 Extended (48h)' : '🔮 Extended Corridor Forecast (up to 48h)'}
            </Typography>
          </Box>
        </Tooltip>
      </Box>
    </Box>
  )
}
