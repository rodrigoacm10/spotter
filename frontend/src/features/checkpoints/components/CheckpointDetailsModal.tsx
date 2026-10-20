import React, { useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AirIcon from '@mui/icons-material/Air'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import AcUnitIcon from '@mui/icons-material/AcUnit'
import ThermostatIcon from '@mui/icons-material/Thermostat'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import type { AnalyzedRoute, CheckpointData } from '@/shared/types'
import { CheckpointTableRow } from './CheckpointTableRow'

export interface CheckpointDetailsModalProps {
  open: boolean
  onClose: () => void
  route: AnalyzedRoute | null
  onSelectCheckpoint?: (checkpoint: CheckpointData) => void
}

interface ColumnConfig {
  id: string
  label: React.ReactNode
  align?: 'left' | 'center' | 'right'
  width?: number | string
}

const TABLE_COLUMNS: readonly ColumnConfig[] = [
  { id: 'index', label: '#', width: 70 },
  { id: 'mile', label: 'Mile' },
  {
    id: 'eta',
    label: (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <AccessTimeIcon fontSize="small" /> ETA
      </Box>
    ),
  },
  { id: 'risk', label: 'Overall Risk', align: 'center' },
  {
    id: 'wind',
    label: (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
        <AirIcon fontSize="small" color="primary" /> Wind
      </Box>
    ),
    align: 'right',
  },
  {
    id: 'rain',
    label: (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
        <WaterDropIcon fontSize="small" color="info" /> Rain
      </Box>
    ),
    align: 'right',
  },
  {
    id: 'snow',
    label: (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
        <AcUnitIcon fontSize="small" /> Snow
      </Box>
    ),
    align: 'right',
  },
  {
    id: 'temp',
    label: (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
        <ThermostatIcon fontSize="small" color="warning" /> Temp
      </Box>
    ),
    align: 'right',
  },
  { id: 'reasons', label: 'Reason / Rules Triggered' },
]

export const CheckpointDetailsModal: React.FC<CheckpointDetailsModalProps> = ({
  open,
  onClose,
  route,
  onSelectCheckpoint,
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const handleSelectCheckpoint = useCallback(
    (checkpoint: CheckpointData) => {
      if (onSelectCheckpoint) {
        onSelectCheckpoint(checkpoint)
        onClose()
      }
    },
    [onSelectCheckpoint, onClose]
  )

  if (!route) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      aria-labelledby="checkpoint-analysis-title"
    >
      <DialogTitle
        id="checkpoint-analysis-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: { xs: 2, sm: 2.5 },
        }}
      >
        <Box sx={{ pr: 2 }}>
          <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Checkpoint Analysis — {route.summary}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
            {route.distance_miles.toFixed(1)} mi · {route.duration_hours.toFixed(1)}h · {route.checkpoints.length} points
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {route.is_recommended && (
            <Chip label="★ RECOMMENDED" color="primary" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
          )}
          <IconButton aria-label="close modal" onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <TableContainer component={Paper} sx={{ maxHeight: 520, backgroundColor: 'transparent' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: '#131d31' } }}>
                {TABLE_COLUMNS.map((column) => (
                  <TableCell key={column.id} align={column.align} width={column.width}>
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {route.checkpoints.map((checkpoint) => (
                <CheckpointTableRow
                  key={checkpoint.index}
                  checkpoint={checkpoint}
                  onSelect={onSelectCheckpoint ? handleSelectCheckpoint : undefined}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
