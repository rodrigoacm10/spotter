import React from 'react'
import {
  Paper,
  Box,
  Typography,
  Chip,
  Button,
  Tooltip,
} from '@mui/material'
import StarIcon from '@mui/icons-material/Star'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import RouteIcon from '@mui/icons-material/AltRoute'
import ListAltIcon from '@mui/icons-material/ListAlt'
import type { AnalyzedRoute } from '@/shared/types'
import { RISK_COLORS } from '@/shared/theme'
import { formatDurationHours } from '@/shared/utils'
import { RouteRiskBar } from './RouteRiskBar'
import { RouteHazardChips } from './RouteHazardChips'
import { useRouteHazards } from '../hooks/useRouteHazards'

export interface RouteCardProps {
  route: AnalyzedRoute
  isSelected: boolean
  onSelect: () => void
  onOpenDetails: () => void
}

export const RouteCard: React.FC<RouteCardProps> = ({
  route,
  isSelected,
  onSelect,
  onOpenDetails,
}) => {
  const formattedDuration = formatDurationHours(route.duration_hours)
  const { maxRisk, maxWind, maxSnow, maxRain } = useRouteHazards(route.checkpoints)

  return (
    <Paper
      elevation={isSelected ? 6 : 2}
      onClick={onSelect}
      sx={{
        p: 2,
        borderRadius: 2.5,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        border: isSelected
          ? '2px solid #38bdf8'
          : '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: isSelected
          ? 'rgba(30, 41, 59, 0.95)'
          : 'rgba(19, 29, 49, 0.75)',
        boxShadow: isSelected
          ? '0 0 20px rgba(56, 189, 248, 0.25)'
          : undefined,
        '&:hover': {
          borderColor: isSelected ? '#38bdf8' : 'rgba(56, 189, 248, 0.4)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2, flexWrap: 'wrap', gap: 0.8 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
          <Chip
            label={`Option #${route.rank}`}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.72rem',
              bgcolor: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)',
              color: isSelected ? '#0f172a' : '#f8fafc',
              flexShrink: 0,
            }}
          />
          <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ maxWidth: { xs: 130, sm: 180 } }}>
            {route.summary || 'Alternative Route'}
          </Typography>
        </Box>

        {route.is_recommended && (
          <Chip
            icon={<StarIcon sx={{ fontSize: '14px !important', color: '#0f172a !important' }} />}
            label="RECOMMENDED"
            size="small"
            sx={{
              bgcolor: '#10b981',
              color: '#0f172a',
              fontWeight: 800,
              fontSize: '0.7rem',
              letterSpacing: 0.5,
              flexShrink: 0,
            }}
          />
        )}
      </Box>

      {route.recommendation_reason && (
        <Box
          sx={{
            mb: 1.5,
            p: 1,
            borderRadius: 1.5,
            bgcolor: route.is_recommended ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
            borderLeft: `3px solid ${route.is_recommended ? '#10b981' : '#64748b'}`,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: route.is_recommended ? '#6ee7b7' : '#94a3b8',
              fontSize: '0.75rem',
              lineHeight: 1.3,
              display: 'block',
            }}
          >
            {route.recommendation_reason}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          <AccessTimeIcon sx={{ fontSize: 18, color: '#38bdf8' }} />
          <Typography variant="body2" fontWeight={700}>
            {formattedDuration}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          <RouteIcon sx={{ fontSize: 18, color: '#94a3b8' }} />
          <Typography variant="body2" color="text.secondary">
            {route.distance_miles.toFixed(1)} mi
          </Typography>
        </Box>

        <Tooltip title={`Peak risk along corridor: ${maxRisk}`}>
          <Chip
            label={maxRisk}
            size="small"
            sx={{
              bgcolor: RISK_COLORS[maxRisk] || '#10b981',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.68rem',
              height: 22,
            }}
          />
        </Tooltip>
      </Box>

      <RouteRiskBar metrics={route.metrics} totalDistance={route.distance_miles} />

      <RouteHazardChips maxWind={maxWind} maxSnow={maxSnow} maxRain={maxRain} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
        <Button
          size="small"
          variant="text"
          startIcon={<ListAltIcon fontSize="small" />}
          onClick={(clickEvent) => {
            clickEvent.stopPropagation()
            onOpenDetails()
          }}
          sx={{
            fontSize: '0.72rem',
            color: '#38bdf8',
            py: 0.2,
            px: 0.8,
            '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.1)' },
          }}
        >
          View Checkpoints ({route.checkpoints?.length || 0})
        </Button>
      </Box>
    </Paper>
  )
}
