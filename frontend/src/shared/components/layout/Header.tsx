import React from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Chip,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import CloudQueueIcon from '@mui/icons-material/CloudQueue'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import ApiIcon from '@mui/icons-material/Api'
import NavigationIcon from '@mui/icons-material/Navigation'

export interface HeaderProps {
  onOpenRules: () => void
  onOpenMobileDrawer?: () => void
}

export const Header: React.FC<HeaderProps> = ({ onOpenRules, onOpenMobileDrawer }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: (themeConfig) => themeConfig.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 1.5, sm: 2, md: 3 }, minHeight: { xs: 56, sm: 64 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
          {isMobile && onOpenMobileDrawer && (
            <Tooltip title="Open route and location panel">
              <Button
                variant="contained"
                size="small"
                onClick={onOpenMobileDrawer}
                startIcon={<NavigationIcon sx={{ transform: 'rotate(45deg)', fontSize: '16px !important' }} />}
                sx={{
                  bgcolor: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  boxShadow: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  py: 0.4,
                  px: { xs: 1, sm: 1.5 },
                  minWidth: 'auto',
                  '&:hover': {
                    bgcolor: 'rgba(56, 189, 248, 0.3)',
                    boxShadow: 'none',
                  },
                }}
              >
                {isSmallMobile ? 'Menu' : 'Routes'}
              </Button>
            </Tooltip>
          )}

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: 32, sm: 40 },
              height: { xs: 32, sm: 40 },
              borderRadius: 2.5,
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              color: '#0f172a',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
            }}
          >
            <LocalShippingIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="h6"
                fontWeight={800}
                sx={{
                  letterSpacing: -0.5,
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  background: 'linear-gradient(to right, #f8fafc, #94a3b8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                SPOTTER AI
              </Typography>
              <Chip
                label="ROUTING"
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  bgcolor: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: { xs: 'none', sm: 'inline-flex' },
                }}
              />
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: { xs: 'none', md: 'block' },
                lineHeight: 1,
                fontSize: '0.7rem',
              }}
            >
              Weather-Aware Heavy Truck Dispatch System
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 1.5 }}>
          <Chip
            icon={<CloudQueueIcon sx={{ fontSize: 16 }} />}
            label="Open-Meteo 48h Weather Forecast"
            variant="outlined"
            size="small"
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.12)',
              color: '#94a3b8',
              fontSize: '0.75rem',
            }}
          />
          <Chip
            icon={<ApiIcon sx={{ fontSize: 16 }} />}
            label="OSRM Routing Engine"
            variant="outlined"
            size="small"
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.12)',
              color: '#94a3b8',
              fontSize: '0.75rem',
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.8, sm: 1.5 } }}>
          {isSmallMobile ? (
            <Tooltip title="Risk Rules">
              <IconButton
                size="small"
                onClick={onOpenRules}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'text.secondary',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)', color: '#fff' },
                }}
              >
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Button
              variant="outlined"
              size="small"
              startIcon={<HelpOutlineIcon />}
              onClick={onOpenRules}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.15)',
                color: 'text.secondary',
                fontSize: '0.75rem',
                py: 0.5,
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                },
              }}
            >
              Risk Rules
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}
