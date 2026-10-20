import React, { useState, useCallback } from 'react'
import {
  Box,
  Alert,
  Snackbar,
  useMediaQuery,
  useTheme,
  Drawer,
  IconButton,
  Button,
  Tooltip,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import NavigationIcon from '@mui/icons-material/Navigation'

import { Header, RiskLegend } from '@/shared'
import type { AnalyzedRoute, CheckpointData, AnalyzeTripParams } from '@/shared/types'
import { RouteForm, RouteList, useTripAnalysis } from '@/features/trip-planning'
import { RouteMap } from '@/features/route-map'
import { WeatherHeatmapSlider, type HeatmapMetric } from '@/features/weather-timeline'
import { CheckpointDetailsModal } from '@/features/checkpoints'
import { RulesInfoModal } from '@/features/hos-rules'

export const App: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<CheckpointData | null>(null)
  const [currentWeight, setCurrentWeight] = useState<number>(35000)

  const [currentHour, setCurrentHour] = useState<number>(0)
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetric>('risk')
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true)

  const [rulesOpen, setRulesOpen] = useState(false)
  const [detailsRoute, setDetailsRoute] = useState<AnalyzedRoute | null>(null)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)

  const {
    analyzeTrip,
    isLoading,
    tripData,
    errorMessage,
    clearError,
  } = useTripAnalysis({
    onSuccess: (data) => {
      const recommended = data.routes.find((route) => route.is_recommended) || data.routes[0]
      if (recommended) {
        setSelectedRouteId(recommended.id)
      }
      setCurrentHour(0)
      if (isMobile) {
        setMobileDrawerOpen(false)
      }
    },
  })

  // Execute trip analysis wrapper
  const handleAnalyzeTrip = useCallback(
    (params: AnalyzeTripParams) => {
      setCurrentWeight(params.load_weight_lbs)
      analyzeTrip(params)
    },
    [analyzeTrip]
  )



  const activeRoute = tripData?.routes.find((route) => route.id === selectedRouteId) || tripData?.routes[0] || null

  // Sidebar content (Form + Route Cards)
  const sidebarContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2.2,
        p: { xs: 2, sm: 2.5 },
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <RouteForm
        onAnalyze={(params) => {
          handleAnalyzeTrip(params)
          if (isMobile) {
            setMobileDrawerOpen(false)
          }
        }}
        isLoading={isLoading}
      />

      {tripData && tripData.routes.length > 0 && (
        <RouteList
          routes={tripData.routes}
          selectedRouteId={selectedRouteId}
          onSelectRoute={(routeId) => {
            setSelectedRouteId(routeId)
            setSelectedCheckpoint(null)
          }}
          onOpenDetails={(route) => setDetailsRoute(route)}
        />
      )}
    </Box>
  )

  const hasTopLeftButton = isMobile || !desktopSidebarOpen

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100vw', overflow: 'hidden' }}>
      <Header
        onOpenRules={() => setRulesOpen(true)}
        onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
      />

      <Box sx={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        {!isMobile && desktopSidebarOpen && (
          <Box
            sx={{
              width: { md: 380, lg: 440 },
              minWidth: { md: 380, lg: 440 },
              height: '100%',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              bgcolor: 'background.default',
              zIndex: 5,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                py: 1,
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                bgcolor: 'rgba(15, 23, 42, 0.4)',
              }}
            >
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Dispatch Panel
              </Typography>
              <Tooltip title="Hide Sidebar (View full screen map)">
                <IconButton size="small" onClick={() => setDesktopSidebarOpen(false)} sx={{ color: 'text.secondary', p: 0.5 }}>
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              {sidebarContent}
            </Box>
          </Box>
        )}

        {isMobile && (
          <Drawer
            anchor="left"
            open={mobileDrawerOpen}
            onClose={() => setMobileDrawerOpen(false)}
            PaperProps={{
              sx: {
                width: '100vw',
                maxWidth: '100vw',
                height: '100dvh',
                bgcolor: 'background.default',
                backgroundImage: 'none',
                display: 'flex',
                flexDirection: 'column',
              },
            }}
            sx={{
              zIndex: (themeConfig) => themeConfig.zIndex.modal + 10,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: { xs: 2, sm: 3 },
                py: 1.5,
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                bgcolor: 'rgba(15, 23, 42, 0.98)',
                backdropFilter: 'blur(16px)',
                position: 'sticky',
                top: 0,
                zIndex: 10,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                    color: '#0f172a',
                    boxShadow: '0 0 10px rgba(56, 189, 248, 0.4)',
                  }}
                >
                  <NavigationIcon sx={{ transform: 'rotate(45deg)', fontSize: 18 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: 0.5, lineHeight: 1.2 }}>
                    ROUTE PLANNER
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                    Weather-Aware Truck Dispatch
                  </Typography>
                </Box>
              </Box>

              <IconButton
                aria-label="Close route planner"
                onClick={() => setMobileDrawerOpen(false)}
                sx={{
                  color: '#38bdf8',
                  bgcolor: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  boxShadow: '0 0 8px rgba(56, 189, 248, 0.2)',
                  p: 0.8,
                  '&:hover': {
                    bgcolor: 'rgba(56, 189, 248, 0.28)',
                    color: '#ffffff',
                    boxShadow: '0 0 14px rgba(56, 189, 248, 0.4)',
                  },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              {sidebarContent}
            </Box>
          </Drawer>
        )}

        <Box sx={{ flex: 1, position: 'relative', height: '100%' }}>
          {isMobile && (
            <Button
              variant="contained"
              startIcon={<NavigationIcon sx={{ transform: 'rotate(45deg)', fontSize: '16px !important' }} />}
              onClick={() => setMobileDrawerOpen(true)}
              sx={{
                position: 'absolute',
                top: 16,
                left: 16,
                zIndex: 10,
                bgcolor: 'rgba(15, 23, 42, 0.92)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
                fontWeight: 700,
                fontSize: '0.8rem',
                color: '#f8fafc',
                '&:hover': { bgcolor: 'rgba(30, 41, 59, 0.95)' },
              }}
            >
              Routes & Locations {tripData?.routes.length ? `(${tripData.routes.length})` : ''}
            </Button>
          )}

          {!isMobile && !desktopSidebarOpen && (
            <Tooltip title="Expand Sidebar">
              <Button
                variant="contained"
                startIcon={<NavigationIcon sx={{ transform: 'rotate(45deg)', fontSize: '16px !important' }} />}
                onClick={() => setDesktopSidebarOpen(true)}
                sx={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  zIndex: 10,
                  bgcolor: 'rgba(15, 23, 42, 0.92)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  color: '#f8fafc',
                  '&:hover': { bgcolor: 'rgba(30, 41, 59, 0.95)' },
                }}
              >
                Route Panel {tripData?.routes.length ? `(${tripData.routes.length})` : ''}
              </Button>
            </Tooltip>
          )}

          <RouteMap
            routes={tripData?.routes || []}
            selectedRouteId={selectedRouteId}
            onSelectRoute={(routeId) => {
              setSelectedRouteId(routeId)
              setSelectedCheckpoint(null)
            }}
            currentHour={currentHour}
            heatmapMetric={heatmapMetric}
            showHeatmap={showHeatmap}
            selectedCheckpoint={selectedCheckpoint}
            onSelectCheckpoint={(checkpoint) => setSelectedCheckpoint(checkpoint)}
            loadWeightLbs={currentWeight}
            origin={tripData?.origin}
            destination={tripData?.destination}
          />

          {tripData && tripData.routes.length > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: hasTopLeftButton ? 68 : 16,
                left: 16,
                zIndex: 9,
              }}
            >
              <RiskLegend />
            </Box>
          )}

          {activeRoute && (
            <Box
              sx={{
                position: 'absolute',
                bottom: { xs: 12, sm: 20 },
                left: '50%',
                transform: 'translateX(-50%)',
                width: { xs: 'calc(100% - 24px)', sm: '92%', md: '88%' },
                maxWidth: 780,
                zIndex: 10,
              }}
            >
              <WeatherHeatmapSlider
                currentHour={currentHour}
                onChangeHour={setCurrentHour}
                metric={heatmapMetric}
                onChangeMetric={(selectedMetric) => setHeatmapMetric(selectedMetric)}
                showHeatmap={showHeatmap}
                onToggleShowHeatmap={(shouldShowHeatmap) => setShowHeatmap(shouldShowHeatmap)}
                departureTime={tripData?.departure_time || new Date().toISOString()}
                tripDurationHours={activeRoute.duration_hours}
              />
            </Box>
          )}
        </Box>
      </Box>

      <RulesInfoModal open={rulesOpen} onClose={() => setRulesOpen(false)} />

      <CheckpointDetailsModal
        open={Boolean(detailsRoute)}
        onClose={() => setDetailsRoute(null)}
        route={detailsRoute}
        onSelectCheckpoint={(checkpoint) => {
          setSelectedCheckpoint(checkpoint)
          setDetailsRoute(null)
        }}
      />

      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={6000}
        onClose={clearError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={clearError} sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default App
