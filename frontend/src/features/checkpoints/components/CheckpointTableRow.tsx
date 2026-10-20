import React from 'react'
import {
  TableRow,
  TableCell,
  Chip,
  Box,
  Typography,
} from '@mui/material'
import type { CheckpointData } from '@/shared/types'
import { RISK_COLORS } from '@/shared/theme'
import { formatEta } from '@/shared/utils'

export interface CheckpointTableRowProps {
  checkpoint: CheckpointData
  onSelect?: (checkpoint: CheckpointData) => void
}

export const CheckpointTableRow: React.FC<CheckpointTableRowProps> = React.memo(({
  checkpoint,
  onSelect,
}) => {
  const etaFormatted = formatEta(checkpoint.eta)
  const riskColor = RISK_COLORS[checkpoint.risk.overall_risk] || '#10B981'
  const isClickable = Boolean(onSelect)

  return (
    <TableRow
      hover
      sx={{
        cursor: isClickable ? 'pointer' : 'default',
        '&:nth-of-type(odd)': { backgroundColor: 'rgba(255, 255, 255, 0.02)' },
      }}
      onClick={() => onSelect?.(checkpoint)}
    >
      <TableCell sx={{ fontWeight: 600 }}>{checkpoint.index + 1}</TableCell>
      <TableCell>{checkpoint.mile.toFixed(1)} mi</TableCell>
      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
        {etaFormatted}
      </TableCell>
      <TableCell align="center">
        <Chip
          label={checkpoint.risk.overall_risk}
          size="small"
          sx={{
            bgcolor: riskColor,
            color: '#fff',
            fontWeight: 700,
            minWidth: 80,
          }}
        />
      </TableCell>
      <TableCell align="right" sx={{ fontWeight: 600 }}>
        {checkpoint.weather.wind_mph.toFixed(1)} mph
      </TableCell>
      <TableCell align="right">
        {checkpoint.weather.rain_in_hr > 0 ? `${checkpoint.weather.rain_in_hr.toFixed(2)} in/h` : '—'}
      </TableCell>
      <TableCell align="right">
        {checkpoint.weather.snow_in_hr > 0 ? `${checkpoint.weather.snow_in_hr.toFixed(2)} in/h` : '—'}
      </TableCell>
      <TableCell align="right">
        {checkpoint.weather.temperature.toFixed(1)}°F
      </TableCell>
      <TableCell>
        {checkpoint.risk.reasons && checkpoint.risk.reasons.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
            {checkpoint.risk.reasons.map((reason, reasonIndex) => (
              <Typography key={reasonIndex} variant="caption" sx={{ color: riskColor, fontWeight: 500 }}>
                • {reason}
              </Typography>
            ))}
          </Box>
        ) : (
          <Typography variant="caption" color="text.secondary">
            Conditions within safe thresholds
          </Typography>
        )}
      </TableCell>
    </TableRow>
  )
})

CheckpointTableRow.displayName = 'CheckpointTableRow'
