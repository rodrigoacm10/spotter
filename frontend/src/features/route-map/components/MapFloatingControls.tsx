import React from 'react'
import { Box, Paper, IconButton, Tooltip } from '@mui/material'
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'

export interface MapFloatingControlsProps {
  mapStyleKey: 'dark' | 'light'
  onToggleMapStyle: () => void
  onFitRouteBounds: () => void
}

export const MapFloatingControls: React.FC<MapFloatingControlsProps> = ({
  mapStyleKey,
  onToggleMapStyle,
  onFitRouteBounds,
}) => {
  const isDark = mapStyleKey === 'dark'

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 16,
        right: 56,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        zIndex: 10,
      }}
    >
      <Tooltip title="Fit view to full route">
        <Paper
          elevation={3}
          sx={{
            bgcolor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            borderRadius: 2,
          }}
        >
          <IconButton
            size="small"
            onClick={onFitRouteBounds}
            aria-label="Fit view to full route"
            sx={{ color: '#38bdf8', p: 1 }}
          >
            <ZoomOutMapIcon fontSize="small" />
          </IconButton>
        </Paper>
      </Tooltip>

      <Tooltip title={`Switch map: ${isDark ? 'Light Mode' : 'Dark Mode'}`}>
        <Paper
          elevation={3}
          sx={{
            bgcolor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            borderRadius: 2,
          }}
        >
          <IconButton
            size="small"
            onClick={onToggleMapStyle}
            aria-label="Toggle map light/dark style"
            sx={{ color: '#f8fafc', p: 1 }}
          >
            {isDark ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
          </IconButton>
        </Paper>
      </Tooltip>
    </Box>
  )
}
