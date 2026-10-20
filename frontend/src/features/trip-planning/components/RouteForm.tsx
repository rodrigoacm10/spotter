import React, { useState, useCallback } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import NavigationIcon from '@mui/icons-material/Navigation'
import SearchIcon from '@mui/icons-material/Search'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import dayjs from 'dayjs'
import { useForm, Controller, useWatch, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import type { AnalyzeTripParams, LocationOption } from '@/shared/types'
import type { DemoPreset } from '../constants/presets'
import { useLocationSearch } from '../hooks/useLocationSearch'
import { routeFormSchema, type RouteFormData } from '../schemas/routeFormSchema'
import { RoutePresetsBar } from './RoutePresetsBar'
import { RouteLocationInputs } from './RouteLocationInputs'
import { CargoWeightSection } from './CargoWeightSection'
import { SamplingIntervalToggle } from './SamplingIntervalToggle'
import { RouteFormMinimized } from './RouteFormMinimized'

export interface RouteFormProps {
  onAnalyze: (params: AnalyzeTripParams) => void
  isLoading: boolean
  initialValues?: Partial<AnalyzeTripParams>
}

export const RouteForm: React.FC<RouteFormProps> = ({
  onAnalyze,
  isLoading,
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [isFormCollapsed, setIsFormCollapsed] = useState(false)

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<RouteFormData>({
    resolver: zodResolver(routeFormSchema) as Resolver<RouteFormData>,
    defaultValues: {
      origin: null,
      dest: null,
      departureTime: dayjs().add(1, 'hour'),
      weight: 35000,
      interval: 25,
    },
  })

  const origin = useLocationSearch('', null)
  const dest = useLocationSearch('', null)

  const watchedOrigin = useWatch({ control, name: 'origin' })
  const watchedDest = useWatch({ control, name: 'dest' })
  const watchedWeight = useWatch({ control, name: 'weight' })
  const watchedInterval = useWatch({ control, name: 'interval' })
  const watchedDepartureTime = useWatch({ control, name: 'departureTime' })

  const handleSwap = useCallback(() => {
    const currentOrigin = getValues('origin')
    const currentDest = getValues('dest')

    setValue('origin', currentDest, { shouldValidate: true })
    setValue('dest', currentOrigin, { shouldValidate: true })

    origin.setSelectedOption(currentDest)
    origin.setInputValue(currentDest?.display_name || '')

    dest.setSelectedOption(currentOrigin)
    dest.setInputValue(currentOrigin?.display_name || '')
  }, [dest, getValues, origin, setValue])

  const handleApplyPreset = useCallback((preset: DemoPreset) => {
    const newOrigin: LocationOption = {
      display_name: preset.originName,
      latitude: preset.originLat,
      longitude: preset.originLon,
    }
    const newDest: LocationOption = {
      display_name: preset.destName,
      latitude: preset.destLat,
      longitude: preset.destLon,
    }

    setValue('origin', newOrigin, { shouldValidate: true })
    setValue('dest', newDest, { shouldValidate: true })
    setValue('weight', preset.loadWeightLbs, { shouldValidate: true })
    setValue('interval', preset.sampleInterval as 10 | 25 | 50, { shouldValidate: true })

    origin.setSelectedOption(newOrigin)
    origin.setInputValue(preset.originName)

    dest.setSelectedOption(newDest)
    dest.setInputValue(preset.destName)

    const departureTime = getValues('departureTime') || dayjs()
    onAnalyze({
      origin_lat: preset.originLat,
      origin_lon: preset.originLon,
      dest_lat: preset.destLat,
      dest_lon: preset.destLon,
      departure_time: departureTime.toISOString(),
      load_weight_lbs: preset.loadWeightLbs,
      sample_interval_miles: preset.sampleInterval,
    })
  }, [dest, getValues, onAnalyze, origin, setValue])

  const onValidSubmit = (data: RouteFormData) => {
    if (!data.origin || !data.dest) return

    const departureTimeIso = (data.departureTime || dayjs()).toISOString()
    onAnalyze({
      origin_lat: data.origin.latitude,
      origin_lon: data.origin.longitude,
      dest_lat: data.dest.latitude,
      dest_lon: data.dest.longitude,
      departure_time: departureTimeIso,
      load_weight_lbs: data.weight,
      sample_interval_miles: data.interval,
    })
  }

  if (isFormCollapsed) {
    return (
      <RouteFormMinimized
        originName={watchedOrigin?.display_name || origin.inputValue}
        destName={watchedDest?.display_name || dest.inputValue}
        weight={watchedWeight}
        interval={watchedInterval}
        departureTime={watchedDepartureTime}
        isLoading={isLoading}
        canSubmit={!!watchedOrigin && !!watchedDest}
        onExpand={() => setIsFormCollapsed(false)}
        onSubmit={handleSubmit(onValidSubmit)}
      />
    )
  }

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit(onValidSubmit)}
      elevation={3}
      sx={{
        p: { xs: 1.8, sm: 2.5 },
        borderRadius: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 2.2,
        backgroundColor: 'rgba(19, 29, 49, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>
          <NavigationIcon color="primary" sx={{ transform: 'rotate(45deg)' }} />
          Plan Trip
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label="Spotter AI"
            size="small"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              fontWeight: 700,
              bgcolor: 'rgba(56, 189, 248, 0.12)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          />
          {!isMobile && (
            <Tooltip title="Minimize form to view map and routes">
              <IconButton
                size="small"
                onClick={() => setIsFormCollapsed(true)}
                sx={{
                  color: '#94a3b8',
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  p: 0.5,
                  '&:hover': { color: '#f8fafc', bgcolor: 'rgba(255, 255, 255, 0.18)' },
                }}
              >
                <KeyboardArrowUpIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      <RoutePresetsBar onSelectPreset={handleApplyPreset} />

      <RouteLocationInputs
        originValue={watchedOrigin}
        originSearch={origin}
        originError={errors.origin?.message}
        onChangeOrigin={(selectedOption) => setValue('origin', selectedOption, { shouldValidate: true })}
        destValue={watchedDest}
        destSearch={dest}
        destError={errors.dest?.message}
        onChangeDest={(selectedOption) => setValue('dest', selectedOption, { shouldValidate: true })}
        onSwap={handleSwap}
      />

      <Controller
        name="departureTime"
        control={control}
        render={({ field }) => (
          <DateTimePicker
            label="Departure Date & Time"
            value={field.value}
            onChange={(newValue) => field.onChange(newValue)}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true,
                error: !!errors.departureTime,
                helperText: errors.departureTime?.message,
              },
            }}
          />
        )}
      />

      <Controller
        name="weight"
        control={control}
        render={({ field }) => (
          <CargoWeightSection
            weight={field.value}
            onChangeWeight={(selectedWeight) => field.onChange(selectedWeight)}
            error={errors.weight?.message}
          />
        )}
      />

      <Controller
        name="interval"
        control={control}
        render={({ field }) => (
          <SamplingIntervalToggle
            interval={field.value}
            onChangeInterval={(selectedInterval) => field.onChange(selectedInterval)}
          />
        )}
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={isLoading || !watchedOrigin || !watchedDest}
        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
        sx={{
          py: 1.4,
          fontWeight: 700,
          fontSize: '0.95rem',
          letterSpacing: 0.3,
        }}
      >
        {isLoading ? 'Analyzing 3 Routes & Weather...' : 'Compute Routes & Forecast'}
      </Button>
    </Paper>
  )
}
