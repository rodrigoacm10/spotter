import React, { useState } from 'react'
import { Box, Paper, Typography, IconButton, Collapse, useTheme, useMediaQuery } from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import ShieldIcon from '@mui/icons-material/Shield'
import { RISK_COLORS } from '@/shared/theme'

export interface RiskLegendProps {
  initialExpanded?: boolean
}

const RISK_ITEMS = [
  { level: 'Low', description: 'Wind <25 mph | Rain <0.1" | Snow <0.5"', color: RISK_COLORS.Low },
  { level: 'Moderate', description: 'Wind 25-34 mph | Rain 0.1-0.25"', color: RISK_COLORS.Moderate },
  { level: 'High', description: 'Wind 35-44 mph | Rain 0.25-0.5"', color: RISK_COLORS.High },
  { level: 'Severe', description: 'Wind 45-54 mph / >40k lbs at 35+ mph', color: RISK_COLORS.Severe },
  { level: 'No Travel', description: 'Wind ≥55 mph / >30k lbs at 45+ mph', color: RISK_COLORS['No Travel'] },
]

export const RiskLegend: React.FC<RiskLegendProps> = ({ initialExpanded }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [expanded, setExpanded] = useState(initialExpanded !== undefined ? initialExpanded : !isMobile)

  return (
    <Paper
      elevation={4}
      sx={{
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 2,
        p: { xs: 1, sm: 1.5 },
        minWidth: { xs: 180, sm: 220 },
        maxWidth: { xs: 240, sm: 280 },
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.6)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShieldIcon sx={{ fontSize: 18, color: '#38bdf8' }} />
          <Typography variant="caption" fontWeight={700} sx={{ letterSpacing: 0.5, textTransform: 'uppercase' }}>
            Risk Levels
          </Typography>
        </Box>
        <IconButton size="small" sx={{ p: 0.2, color: 'text.secondary' }}>
          {expanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1.5 }}>
          {RISK_ITEMS.map((riskItem) => (
            <Box key={riskItem.level} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: riskItem.color,
                  boxShadow: `0 0 8px ${riskItem.color}88`,
                  mt: 0.3,
                  flexShrink: 0,
                }}
              />
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                  {riskItem.level}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem', lineHeight: 1.15 }}>
                  {riskItem.description}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Paper>
  )
}
