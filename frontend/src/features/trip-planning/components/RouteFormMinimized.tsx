import React from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Chip,
} from '@mui/material'
import NavigationIcon from '@mui/icons-material/Navigation'
import PlaceIcon from '@mui/icons-material/Place'
import EditIcon from '@mui/icons-material/Edit'
import SearchIcon from '@mui/icons-material/Search'
import { Dayjs } from 'dayjs'

interface RouteFormMinimizedProps {
  originName: string
  destName: string
  weight: number
  interval: number
  departureTime: Dayjs | null
  isLoading: boolean
  canSubmit: boolean
  onExpand: () => void
  onSubmit: (formEvent: React.FormEvent) => void
}

export const RouteFormMinimized: React.FC<RouteFormMinimizedProps> = ({
  originName,
  destName,
  weight,
  interval,
  departureTime,
  isLoading,
  canSubmit,
  onExpand,
  onSubmit,
}) => {
  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 1.8, sm: 2 },
        borderRadius: 3,
        backgroundColor: 'rgba(19, 29, 49, 0.9)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.5)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NavigationIcon color="primary" sx={{ transform: 'rotate(45deg)', fontSize: 18 }} />
          <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            Trip Locations
          </Typography>
        </Box>
        <Button
          size="small"
          variant="outlined"
          startIcon={<EditIcon fontSize="small" />}
          onClick={onExpand}
          sx={{
            fontSize: '0.72rem',
            py: 0.3,
            px: 1,
            borderColor: 'rgba(56, 189, 248, 0.4)',
            color: '#38bdf8',
            '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.15)', borderColor: '#38bdf8' },
          }}
        >
          Edit Locations
        </Button>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.8,
          bgcolor: 'rgba(0, 0, 0, 0.3)',
          p: 1.2,
          borderRadius: 2,
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <PlaceIcon sx={{ color: '#10b981', fontSize: 18, flexShrink: 0 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem', lineHeight: 1 }}>
              Origin
            </Typography>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ color: '#f8fafc', fontSize: '0.82rem' }}>
              {originName || 'Not set'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <PlaceIcon sx={{ color: '#ef4444', fontSize: 18, flexShrink: 0 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem', lineHeight: 1 }}>
              Destination
            </Typography>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ color: '#f8fafc', fontSize: '0.82rem' }}>
              {destName || 'Not set'}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexWrap: 'wrap' }}>
        <Chip
          size="small"
          label={`${weight.toLocaleString()} lbs`}
          color={weight > 40000 ? 'error' : weight > 30000 ? 'warning' : 'primary'}
          sx={{ fontSize: '0.68rem', fontWeight: 700, height: 22 }}
        />
        <Chip
          size="small"
          label={`Sampling: ${interval} mi`}
          variant="outlined"
          sx={{ fontSize: '0.68rem', color: '#94a3b8', height: 22 }}
        />
        {departureTime && (
          <Chip
            size="small"
            label={`Departure: ${departureTime.format('MM/DD HH:mm')}`}
            variant="outlined"
            sx={{ fontSize: '0.68rem', color: '#94a3b8', height: 22 }}
          />
        )}
      </Box>

      <Button
        variant="contained"
        size="small"
        onClick={onSubmit}
        disabled={isLoading || !canSubmit}
        startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon fontSize="small" />}
        sx={{ fontWeight: 700, fontSize: '0.8rem', py: 0.8 }}
      >
        {isLoading ? 'Recalculating...' : 'Recalculate Routes'}
      </Button>
    </Paper>
  )
}
