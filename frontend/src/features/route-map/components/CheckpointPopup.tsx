import React from 'react'
import { Popup } from 'react-map-gl/maplibre'
import { Box, Typography, Chip, Divider } from '@mui/material'
import AirIcon from '@mui/icons-material/Air'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import ThermostatIcon from '@mui/icons-material/Thermostat'
import AcUnitIcon from '@mui/icons-material/AcUnit'
import type { CheckpointData } from '@/shared/types'
import { RISK_COLORS } from '@/shared/theme'
import { formatEta } from '@/shared/utils'

interface WeatherStatItemProps {
  icon: React.ReactNode
  label: string
  value: string
}

const WeatherStatItem: React.FC<WeatherStatItemProps> = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
    {icon}
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700}>
        {value}
      </Typography>
    </Box>
  </Box>
)

interface CheckpointPopupProps {
  checkpoint: CheckpointData
  onClose: () => void
}

export const CheckpointPopup: React.FC<CheckpointPopupProps> = ({ checkpoint, onClose }) => {
  return (
    <Popup
      longitude={checkpoint.longitude}
      latitude={checkpoint.latitude}
      anchor="bottom"
      onClose={onClose}
      closeOnClick={false}
      offset={14}
    >
      <Box sx={{ p: 1.8, minWidth: 240, maxWidth: 300 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box>
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#38bdf8' }}>
              Checkpoint #{checkpoint.index + 1}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Mile {checkpoint.mile.toFixed(1)} of route
            </Typography>
          </Box>
          <Chip
            label={checkpoint.risk.overall_risk}
            size="small"
            sx={{
              bgcolor: RISK_COLORS[checkpoint.risk.overall_risk] || '#10B981',
              color: '#fff',
              fontWeight: 700,
            }}
          />
        </Box>

        <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Estimated Time of Arrival (ETA):
          </Typography>
          <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
            {formatEta(checkpoint.eta)}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1,
            p: 1,
            bgcolor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: 1.5,
            mb: 1.2,
          }}
        >
          <WeatherStatItem
            icon={<AirIcon sx={{ fontSize: 16, color: '#38bdf8' }} />}
            label="Wind"
            value={`${checkpoint.weather.wind_mph.toFixed(1)} mph`}
          />
          <WeatherStatItem
            icon={<ThermostatIcon sx={{ fontSize: 16, color: '#f59e0b' }} />}
            label="Temperature"
            value={`${checkpoint.weather.temperature.toFixed(1)}°F`}
          />
          <WeatherStatItem
            icon={<WaterDropIcon sx={{ fontSize: 16, color: '#38bdf8' }} />}
            label="Rain"
            value={`${checkpoint.weather.rain_in_hr.toFixed(2)} in/h`}
          />
          <WeatherStatItem
            icon={<AcUnitIcon sx={{ fontSize: 16, color: '#93c5fd' }} />}
            label="Snow"
            value={`${checkpoint.weather.snow_in_hr.toFixed(2)} in/h`}
          />
        </Box>

        {checkpoint.risk.reasons && checkpoint.risk.reasons.length > 0 ? (
          <Box sx={{ bgcolor: 'rgba(239, 68, 68, 0.15)', p: 1, borderRadius: 1.5 }}>
            <Typography variant="caption" fontWeight={700} sx={{ color: '#fca5a5', display: 'block', mb: 0.3 }}>
              Triggered Conditions:
            </Typography>
            {checkpoint.risk.reasons.map((reason, reasonIndex) => (
              <Typography key={reasonIndex} variant="caption" sx={{ color: '#fca5a5', display: 'block', fontSize: '0.7rem' }}>
                • {reason}
              </Typography>
            ))}
          </Box>
        ) : (
          <Typography variant="caption" color="text.secondary">
            Safe and favorable driving conditions.
          </Typography>
        )}
      </Box>
    </Popup>
  )
}
