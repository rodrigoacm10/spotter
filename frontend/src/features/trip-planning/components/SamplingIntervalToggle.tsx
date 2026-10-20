import React from 'react'
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import SpeedIcon from '@mui/icons-material/Speed'

interface SamplingIntervalToggleProps {
  interval: number
  onChangeInterval: (interval: 10 | 25 | 50) => void
}

export const SamplingIntervalToggle: React.FC<SamplingIntervalToggleProps> = ({
  interval,
  onChangeInterval,
}) => {
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
        <Typography variant="body2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <SpeedIcon fontSize="small" sx={{ color: '#94a3b8' }} />
          Weather Sampling Interval:
        </Typography>
        <Typography variant="caption" color="text.secondary">
          every {interval} miles
        </Typography>
      </Box>

      <ToggleButtonGroup
        value={interval}
        exclusive
        onChange={(_, selectedInterval) => {
          if (selectedInterval !== null) onChangeInterval(selectedInterval as 10 | 25 | 50)
        }}
        fullWidth
        size="small"
        sx={{
          bgcolor: 'rgba(0, 0, 0, 0.25)',
          '& .MuiToggleButton-root': {
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontWeight: 600,
            '&.Mui-selected': {
              bgcolor: 'rgba(56, 189, 248, 0.2)',
              color: '#38bdf8',
              borderColor: '#38bdf8',
            },
          },
        }}
      >
        <ToggleButton value={10}>
          {isSmallScreen ? '10 mi' : '10 miles (High precision)'}
        </ToggleButton>
        <ToggleButton value={25}>
          {isSmallScreen ? '25 mi' : '25 miles (Recommended)'}
        </ToggleButton>
        <ToggleButton value={50}>
          {isSmallScreen ? '50 mi' : '50 miles (Fast)'}
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  )
}
