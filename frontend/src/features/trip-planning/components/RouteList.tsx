import React from 'react'
import { Box, Typography } from '@mui/material'
import type { AnalyzedRoute } from '@/shared/types'
import { RouteCard } from './RouteCard'

export interface RouteListProps {
  routes: AnalyzedRoute[]
  selectedRouteId: string | null
  onSelectRoute: (routeId: string) => void
  onOpenDetails: (route: AnalyzedRoute) => void
}

export const RouteList: React.FC<RouteListProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  onOpenDetails,
}) => {
  if (!routes || routes.length === 0) return null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Analyzed Routes ({routes.length})
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Click to highlight on map
        </Typography>
      </Box>

      {routes.map((route) => (
        <RouteCard
          key={route.id}
          route={route}
          isSelected={route.id === selectedRouteId}
          onSelect={() => onSelectRoute(route.id)}
          onOpenDetails={() => onOpenDetails(route)}
        />
      ))}
    </Box>
  )
}
