import React from 'react'
import {
  Box,
  TextField,
  Autocomplete,
  IconButton,
  Tooltip,
  CircularProgress,
  InputAdornment,
} from '@mui/material'
import PlaceIcon from '@mui/icons-material/Place'
import SwapVertIcon from '@mui/icons-material/SwapVert'
import type { LocationOption } from '@/shared/types'

export interface LocationSearchInstance {
  inputValue: string
  setInputValue: (inputValue: string) => void
  selectedOption: LocationOption | null
  setSelectedOption: (locationOption: LocationOption | null) => void
  options: LocationOption[]
  isLoading: boolean
}

interface RouteLocationInputsProps {
  originValue: LocationOption | null
  originSearch: LocationSearchInstance
  originError?: string
  onChangeOrigin: (locationOption: LocationOption | null) => void

  destValue: LocationOption | null
  destSearch: LocationSearchInstance
  destError?: string
  onChangeDest: (locationOption: LocationOption | null) => void

  onSwap: () => void
}

export const RouteLocationInputs: React.FC<RouteLocationInputsProps> = ({
  originValue,
  originSearch,
  originError,
  onChangeOrigin,
  destValue,
  destSearch,
  destError,
  onChangeDest,
  onSwap,
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, position: 'relative' }}>
      <Autocomplete
        freeSolo
        value={originValue}
        options={originSearch.options}
        getOptionLabel={(option) => (typeof option === 'string' ? option : option.display_name)}
        isOptionEqualToValue={(option, value) =>
          option.latitude === value?.latitude && option.longitude === value?.longitude
        }
        onInputChange={(_, newInputValue) => originSearch.setInputValue(newInputValue)}
        onChange={(_, newValue) => {
          const selected = typeof newValue === 'string' ? null : newValue
          originSearch.setSelectedOption(selected)
          onChangeOrigin(selected)
        }}
        loading={originSearch.isLoading}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Origin (Departure Point)"
            size="small"
            required
            placeholder="e.g. Chicago, IL"
            error={!!originError}
            helperText={originError}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <PlaceIcon sx={{ color: '#10b981' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <>
                  {originSearch.isLoading ? <CircularProgress color="inherit" size={18} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />

      <Box sx={{ display: 'flex', justifyContent: 'center', my: -1, zIndex: 2 }}>
        <Tooltip title="Swap Origin and Destination">
          <IconButton
            size="small"
            onClick={onSwap}
            sx={{
              bgcolor: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#38bdf8',
              '&:hover': { bgcolor: '#334155' },
            }}
          >
            <SwapVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Autocomplete
        freeSolo
        value={destValue}
        options={destSearch.options}
        getOptionLabel={(option) => (typeof option === 'string' ? option : option.display_name)}
        isOptionEqualToValue={(option, value) =>
          option.latitude === value?.latitude && option.longitude === value?.longitude
        }
        onInputChange={(_, newInputValue) => destSearch.setInputValue(newInputValue)}
        onChange={(_, newValue) => {
          const selected = typeof newValue === 'string' ? null : newValue
          destSearch.setSelectedOption(selected)
          onChangeDest(selected)
        }}
        loading={destSearch.isLoading}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Destination (Arrival Point)"
            size="small"
            required
            placeholder="e.g. Indianapolis, IN"
            error={!!destError}
            helperText={destError}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <PlaceIcon sx={{ color: '#ef4444' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <>
                  {destSearch.isLoading ? <CircularProgress color="inherit" size={18} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
    </Box>
  )
}
