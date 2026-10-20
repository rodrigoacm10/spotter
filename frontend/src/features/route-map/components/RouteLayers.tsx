import React, { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/maplibre'
import type * as maplibregl from 'maplibre-gl'
import type { HeatmapMetric } from '@/shared/types'
import type { GeoJSONFeatureCollection } from '../utils/geojson'
import { getHeatmapColorByMetric } from '../utils/mapLayers'

export interface RouteLayersProps {
  showHeatmap: boolean
  heatmapMetric: HeatmapMetric
  heatmapGeoJSON: GeoJSONFeatureCollection
  inactiveRoutesGeoJSON: GeoJSONFeatureCollection
  activeRouteGeoJSON: GeoJSONFeatureCollection
  checkpointsGeoJSON: GeoJSONFeatureCollection
}

export const RouteLayers: React.FC<RouteLayersProps> = ({
  showHeatmap,
  heatmapMetric,
  heatmapGeoJSON,
  inactiveRoutesGeoJSON,
  activeRouteGeoJSON,
  checkpointsGeoJSON,
}) => {
  const heatmapColor = useMemo(
    () => getHeatmapColorByMetric(heatmapMetric),
    [heatmapMetric]
  )

  return (
    <>
      {showHeatmap && (
        <Source id="corridor-heatmap" type="geojson" data={heatmapGeoJSON}>
          <Layer
            id={`weather-heatmap-layer-${heatmapMetric}`}
            key={`heatmap-layer-${heatmapMetric}`}
            type="heatmap"
            maxzoom={15}
            paint={{
              'heatmap-weight': ['get', 'weight'],
              'heatmap-intensity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                3, 1.3,
                7, 2.4,
                11, 3.5,
              ],
              'heatmap-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                3, 38,
                6, 80,
                9, 140,
                13, 240,
              ],
              'heatmap-opacity': 0.85,
              'heatmap-color': heatmapColor as unknown as maplibregl.ExpressionSpecification,
            }}
          />
        </Source>
      )}

      <Source id="inactive-routes" type="geojson" data={inactiveRoutesGeoJSON}>
        <Layer
          id="inactive-routes-line"
          type="line"
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{
            'line-color': '#94a3b8',
            'line-width': 4.5,
            'line-opacity': 0.75,
            'line-dasharray': [2, 1.5],
          }}
        />
      </Source>

      <Source id="active-route" type="geojson" data={activeRouteGeoJSON}>
        <Layer
          id="active-route-glow"
          type="line"
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{
            'line-color': '#0284c7',
            'line-width': 10,
            'line-opacity': 0.45,
            'line-blur': 3,
          }}
        />
        <Layer
          id="active-route-line"
          type="line"
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{
            'line-color': '#38bdf8',
            'line-width': 5,
            'line-opacity': 0.95,
          }}
        />
      </Source>

      <Source id="checkpoints" type="geojson" data={checkpointsGeoJSON}>
        <Layer
          id="checkpoints-glow"
          type="circle"
          paint={{
            'circle-radius': 11,
            'circle-color': ['get', 'color'],
            'circle-opacity': 0.3,
          }}
        />
        <Layer
          id="checkpoints-circle"
          type="circle"
          paint={{
            'circle-radius': 6.5,
            'circle-color': ['get', 'color'],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-opacity': 0.9,
          }}
        />
      </Source>
    </>
  )
}
