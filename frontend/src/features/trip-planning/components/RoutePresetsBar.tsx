import React from 'react'
import { Box, Typography, Chip } from '@mui/material'
import { DEMO_PRESETS, type DemoPreset } from '../constants/presets'

interface RoutePresetsBarProps {
  onSelectPreset: (preset: DemoPreset) => void
}

export const RoutePresetsBar: React.FC<RoutePresetsBarProps> = ({ onSelectPreset }) => {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 0.8 }}>
        Quick Demo Presets:
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.8, overflowX: 'auto', pb: 0.5, '::-webkit-scrollbar': { height: 4 } }}>
        {DEMO_PRESETS.map((preset) => (
          <Chip
            key={preset.id}
            label={preset.name}
            size="small"
            clickable
            color={preset.tagColor}
            variant="outlined"
            onClick={() => onSelectPreset(preset)}
            sx={{
              fontWeight: 600,
              fontSize: '0.72rem',
              whiteSpace: 'nowrap',
              '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.15)' },
            }}
          />
        ))}
      </Box>
    </Box>
  )
}
