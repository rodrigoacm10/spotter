import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import ShieldAlertIcon from '@mui/icons-material/Security'
import ScaleIcon from '@mui/icons-material/Scale'
import StarIcon from '@mui/icons-material/Star'
import { RISK_COLORS } from '@/shared/theme'
import {
  METEOROLOGICAL_THRESHOLDS,
  CARGO_LOAD_RULES,
  RECOMMENDATION_CRITERIA,
  RISK_LEVEL_COLUMNS,
} from '../data/rulesData'

export interface RulesInfoModalProps {
  open: boolean
  onClose: () => void
}

export const RulesInfoModal: React.FC<RulesInfoModalProps> = ({ open, onClose }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      aria-labelledby="weather-rules-title"
    >
      <DialogTitle
        id="weather-rules-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: { xs: 2, sm: 2.5 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ShieldAlertIcon color="primary" />
          <Typography variant="h6" component="span" fontWeight={700} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Weather Risk Rules & Algorithm
          </Typography>
        </Box>
        <IconButton aria-label="close rules modal" onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoOutlinedIcon fontSize="small" color="primary" />
            Meteorological Thresholds per Checkpoint
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Hourly forecast from Open-Meteo is sampled for the exact transit ETA at each checkpoint:
          </Typography>

          <TableContainer component={Paper} sx={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, color: 'text.secondary' } }}>
                  <TableCell>Condition</TableCell>
                  {RISK_LEVEL_COLUMNS.map(({ label, color }) => (
                    <TableCell key={label} align="center">
                      <Chip label={label} size="small" sx={{ bgcolor: color, color: '#fff' }} />
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {METEOROLOGICAL_THRESHOLDS.map((row) => (
                  <TableRow key={row.condition}>
                    <TableCell sx={{ fontWeight: 600 }}>{row.condition}</TableCell>
                    <TableCell align="center">{row.low}</TableCell>
                    <TableCell align="center">{row.moderate}</TableCell>
                    <TableCell align="center">{row.high}</TableCell>
                    <TableCell align="center">{row.severe}</TableCell>
                    <TableCell align="center">{row.noTravel}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScaleIcon fontSize="small" color="warning" />
            Special Cargo Load Weight Rules
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Trailer load weight directly affects lateral stability against crosswinds and escalates severity:
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {CARGO_LOAD_RULES.map((rule) => {
              const chipBg = RISK_COLORS[rule.riskLevel] || '#7F1D1D'

              return (
                <Box
                  key={rule.conditionText}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: rule.bgColor,
                    border: `1px solid ${rule.borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    {rule.conditionText}
                  </Typography>
                  <Chip
                    label={rule.chipLabel}
                    size="small"
                    sx={{ bgcolor: chipBg, color: '#fff', fontWeight: 700 }}
                  />
                </Box>
              )
            })}
          </Box>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StarIcon fontSize="small" color="secondary" />
            Route Recommendation Hierarchy
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            The algorithm compares candidate routes in the following strict priority order:
          </Typography>
          <Box component="ol" sx={{ pl: 2.5, m: 0, '& li': { mb: 0.5, fontSize: '0.875rem' } }}>
            {RECOMMENDATION_CRITERIA.map((criterion, criterionIndex) => (
              <li key={criterionIndex}>
                {criterion.highlight ? (
                  <strong>{criterion.title}</strong>
                ) : (
                  criterion.title
                )}
              </li>
            ))}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">
          Got It
        </Button>
      </DialogActions>
    </Dialog>
  )
}
