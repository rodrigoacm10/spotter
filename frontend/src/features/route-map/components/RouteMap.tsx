import React, { useRef, useState, useMemo } from 'react'
import Map, {
  NavigationControl,
  type MapRef,
} from 'react-map-gl/maplibre'
import * as maplibregl from 'maplibre-gl'
import type { MapGeoJSONFeature } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

maplibregl.setWorkerUrl(workerUrl)

import { Box } from '@mui/material'
import type { AnalyzedRoute, CheckpointData, HeatmapMetric } from '@/shared/types'
import { MAP_STYLES } from '../utils/mapLayers'
import { CheckpointPopup } from './CheckpointPopup'
import { RouteLayers } from './RouteLayers'
import { RouteEndpointMarker } from './RouteEndpointMarker'
import { MapFloatingControls } from './MapFloatingControls'
import { useMapCamera } from '../hooks/useMapCamera'
import {
  buildInactiveRoutesGeoJSON,
  buildActiveRouteGeoJSON,
  buildCheckpointsGeoJSON,
  buildHeatmapGeoJSON,
} from '../utils/geojson'

export interface RouteMapProps {
  routes: AnalyzedRoute[]
  selectedRouteId: string | null
  onSelectRoute: (routeId: string) => void
  currentHour: number
  heatmapMetric: HeatmapMetric
  showHeatmap: boolean
  selectedCheckpoint: CheckpointData | null
  onSelectCheckpoint: (checkpoint: CheckpointData | null) => void
  loadWeightLbs: number
  origin?: { latitude: number; longitude: number }
  destination?: { latitude: number; longitude: number }
}

const INTERACTIVE_LAYER_IDS = ['checkpoints-circle', 'inactive-routes-line']

export const RouteMap: React.FC<RouteMapProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  currentHour,
  heatmapMetric,
  showHeatmap,
  selectedCheckpoint,
  onSelectCheckpoint,
  loadWeightLbs,
  origin,
  destination,
}) => {
  const mapRef = useRef<MapRef | null>(null)
  const [mapStyleKey, setMapStyleKey] = useState<'dark' | 'light'>('dark')
  const [localPopup, setLocalPopup] = useState<CheckpointData | null>(null)

  const activeRoute = useMemo(
    () => routes.find((route) => route.id === selectedRouteId) || routes[0] || null,
    [routes, selectedRouteId]
  )

  const { fitRouteBounds } = useMapCamera({
    mapRef,
    routes,
    activeRoute,
    selectedCheckpoint,
  })

  const inactiveRoutesGeoJSON = useMemo(
    () => buildInactiveRoutesGeoJSON(routes, activeRoute?.id || null),
    [routes, activeRoute?.id]
  )

  const activeRouteGeoJSON = useMemo(
    () => buildActiveRouteGeoJSON(activeRoute),
    [activeRoute]
  )

  const checkpointsGeoJSON = useMemo(
    () => buildCheckpointsGeoJSON(activeRoute),
    [activeRoute]
  )

  const heatmapGeoJSON = useMemo(
    () => buildHeatmapGeoJSON(activeRoute, currentHour, heatmapMetric, loadWeightLbs),
    [activeRoute, currentHour, heatmapMetric, loadWeightLbs]
  )

  const handleMapClick = (event: { features?: MapGeoJSONFeature[] }) => {
    const features = event.features || []
    if (!features.length) return

    const checkpointFeature = features.find((feature) => feature.layer.id === 'checkpoints-circle')
    if (checkpointFeature && activeRoute) {
      const checkpointIndex = checkpointFeature.properties?.index
      const checkpoint = activeRoute.checkpoints.find((candidateCheckpoint) => candidateCheckpoint.index === checkpointIndex)
      if (checkpoint) {
        setLocalPopup(checkpoint)
        onSelectCheckpoint(checkpoint)
        return
      }
    }

    const altRouteFeature = features.find((feature) => feature.layer.id === 'inactive-routes-line')
    if (altRouteFeature) {
      const clickedRouteId = altRouteFeature.properties?.id
      if (clickedRouteId) {
        onSelectRoute(clickedRouteId)
      }
    }
  }

  const startCoordinates = useMemo<[number, number] | undefined>(() => {
    if (origin) return [origin.longitude, origin.latitude]
    const firstCoord = activeRoute?.geometry?.coordinates?.[0]
    return firstCoord ? [firstCoord[0], firstCoord[1]] : undefined
  }, [origin, activeRoute?.geometry?.coordinates])

  const endCoordinates = useMemo<[number, number] | undefined>(() => {
    if (destination) return [destination.longitude, destination.latitude]
    const lastCoord = activeRoute?.geometry?.coordinates?.slice(-1)[0]
    return lastCoord ? [lastCoord[0], lastCoord[1]] : undefined
  }, [destination, activeRoute?.geometry?.coordinates])

  const activePopup = selectedCheckpoint || localPopup

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        initialViewState={{
          longitude: -87.0,
          latitude: 40.5,
          zoom: 5.5,
        }}
        mapStyle={MAP_STYLES[mapStyleKey]}
        style={{ width: '100%', height: '100%' }}
        interactiveLayerIds={INTERACTIVE_LAYER_IDS}
        onClick={handleMapClick}
        cursor="pointer"
      >
        <NavigationControl position="top-right" />

        <RouteLayers
          showHeatmap={showHeatmap}
          heatmapMetric={heatmapMetric}
          heatmapGeoJSON={heatmapGeoJSON}
          inactiveRoutesGeoJSON={inactiveRoutesGeoJSON}
          activeRouteGeoJSON={activeRouteGeoJSON}
          checkpointsGeoJSON={checkpointsGeoJSON}
        />

        <RouteEndpointMarker type="origin" coordinates={startCoordinates} />
        <RouteEndpointMarker type="destination" coordinates={endCoordinates} />

        {activePopup && (
          <CheckpointPopup
            checkpoint={activePopup}
            onClose={() => {
              setLocalPopup(null)
              onSelectCheckpoint(null)
            }}
          />
        )}
      </Map>

      <MapFloatingControls
        mapStyleKey={mapStyleKey}
        onToggleMapStyle={() => setMapStyleKey((currentStyle) => (currentStyle === 'dark' ? 'light' : 'dark'))}
        onFitRouteBounds={fitRouteBounds}
      />
    </Box>
  )
}
