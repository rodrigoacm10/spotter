import { useEffect, useCallback } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import type { AnalyzedRoute, CheckpointData } from '@/shared/types'
import { calculateRouteBounds } from '../utils/geojson'

interface UseMapCameraOptions {
  mapRef: React.RefObject<MapRef | null>
  routes: AnalyzedRoute[]
  activeRoute: AnalyzedRoute | null
  selectedCheckpoint: CheckpointData | null
}

export function useMapCamera({
  mapRef,
  routes,
  activeRoute,
  selectedCheckpoint,
}: UseMapCameraOptions) {
  const fitRouteBounds = useCallback(() => {
    if (!mapRef.current || !activeRoute) return
    const bounds = calculateRouteBounds(activeRoute.geometry?.coordinates || [])
    if (!bounds) return

    mapRef.current.fitBounds(bounds, {
      padding: { top: 90, bottom: 120, left: 380, right: 90 },
      duration: 1200,
    })
  }, [mapRef, activeRoute])

  useEffect(() => {
    if (routes.length > 0) {
      const timeout = setTimeout(fitRouteBounds, 300)
      return () => clearTimeout(timeout)
    }
  }, [routes, activeRoute?.id, fitRouteBounds])

  useEffect(() => {
    if (selectedCheckpoint && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedCheckpoint.longitude, selectedCheckpoint.latitude],
        zoom: 9,
        duration: 1000,
      })
    }
  }, [mapRef, selectedCheckpoint])

  return { fitRouteBounds }
}
