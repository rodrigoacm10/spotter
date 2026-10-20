import React from 'react'
import { Marker } from 'react-map-gl/maplibre'
import { Box, Paper } from '@mui/material'
import PlaceIcon from '@mui/icons-material/Place'
import FlagIcon from '@mui/icons-material/Flag'

export interface RouteEndpointMarkerProps {
  coordinates?: [number, number]
  type: 'origin' | 'destination'
}

const ENDPOINT_CONFIG = {
  origin: {
    label: 'ORIGIN',
    color: '#10b981',
    boxShadow: '0 0 12px rgba(16, 185, 129, 0.7)',
    icon: <PlaceIcon sx={{ fontSize: 20 }} />,
    animation: 'bounce 2s infinite',
  },
  destination: {
    label: 'DESTINATION',
    color: '#ef4444',
    boxShadow: '0 0 12px rgba(239, 68, 68, 0.7)',
    icon: <FlagIcon sx={{ fontSize: 18 }} />,
    animation: undefined,
  },
} as const

export const RouteEndpointMarker: React.FC<RouteEndpointMarkerProps> = ({
  coordinates,
  type,
}) => {
  if (!coordinates) return null

  const config = ENDPOINT_CONFIG[type]

  return (
    <Marker longitude={coordinates[0]} latitude={coordinates[1]} anchor="bottom">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          animation: config.animation,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            px: 1,
            py: 0.3,
            bgcolor: config.color,
            color: '#fff',
            borderRadius: 1.5,
            mb: 0.5,
            fontWeight: 700,
            fontSize: '0.72rem',
          }}
        >
          {config.label}
        </Paper>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: config.color,
            border: '3px solid #fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: config.boxShadow,
          }}
        >
          {config.icon}
        </Box>
      </Box>
    </Marker>
  )
}
