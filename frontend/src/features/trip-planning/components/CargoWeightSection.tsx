import React from 'react'
import { Box, Typography, Chip, Slider } from '@mui/material'
import ScaleIcon from '@mui/icons-material/Scale'

const WEIGHT_SHORTCUTS = [
  { label: 'Light (15k)', weightLbs: 15000, triggersSevereRule: false },
  { label: 'Standard (32k)', weightLbs: 32000, triggersSevereRule: false },
  { label: 'Heavy (42k)', weightLbs: 42000, triggersSevereRule: true },
  { label: 'Extreme (50k)', weightLbs: 50000, triggersSevereRule: true },
]

interface CargoWeightSectionProps {
  weight: number
  onChangeWeight: (weight: number) => void
  error?: string
}

export const CargoWeightSection: React.FC<CargoWeightSectionProps> = ({
  weight,
  onChangeWeight,
  error,
}) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <ScaleIcon fontSize="small" sx={{ color: weight > 40000 ? '#ef4444' : '#38bdf8' }} />
          Cargo Load Weight:
        </Typography>
        <Chip
          label={`${weight.toLocaleString()} lbs`}
          size="small"
          color={weight > 40000 ? 'error' : weight > 30000 ? 'warning' : 'primary'}
          sx={{ fontWeight: 700, fontFamily: 'monospace' }}
        />
      </Box>

      <Slider
        value={weight}
        min={5000}
        max={60000}
        step={1000}
        onChange={(_, newWeight) => onChangeWeight(newWeight as number)}
        valueLabelDisplay="auto"
        valueLabelFormat={(weightValue) => `${(weightValue / 1000).toFixed(0)}k lbs`}
        sx={{
          color: weight > 40000 ? '#ef4444' : weight > 30000 ? '#f59e0b' : '#38bdf8',
        }}
      />

      <Box sx={{ display: 'flex', gap: 0.6, mt: 0.5, flexWrap: 'wrap' }}>
        {WEIGHT_SHORTCUTS.map((shortcut) => (
          <Chip
            key={shortcut.label}
            label={shortcut.label}
            size="small"
            onClick={() => onChangeWeight(shortcut.weightLbs)}
            variant={weight === shortcut.weightLbs ? 'filled' : 'outlined'}
            color={shortcut.triggersSevereRule ? 'error' : 'default'}
            sx={{
              fontSize: '0.68rem',
              cursor: 'pointer',
              fontWeight: weight === shortcut.weightLbs ? 700 : 500,
            }}
          />
        ))}
      </Box>

      {error && (
        <Typography variant="caption" sx={{ color: '#ef4444', display: 'block', mt: 0.5 }}>
          {error}
        </Typography>
      )}

      {weight > 40000 && !error && (
        <Typography variant="caption" sx={{ color: '#fca5a5', display: 'block', mt: 0.8, fontWeight: 500 }}>
          ⚠️ Cargo &gt; 40k lbs triggers safety rule: winds 35–44 mph escalate to Severe.
        </Typography>
      )}
    </Box>
  )
}
