import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapboxOverlay } from '@deck.gl/mapbox'
import { getBasemap } from './basemaps'
import { buildLayers } from './layers'
import { getTooltip } from './tooltip'
import { useStore } from '@/state/store'

// Hide/show the basemap's text (place/city) labels. Vector styles (CARTO
// Dark/Light) carry labels as symbol layers we can toggle; raster styles
// (OSM streets) bake labels into the tiles and can't be changed.
function applyPlaceLabels(map: maplibregl.Map, show: boolean): void {
  if (!map.isStyleLoaded()) return
  for (const layer of map.getStyle().layers ?? []) {
    if (layer.type === 'symbol') {
      map.setLayoutProperty(layer.id, 'visibility', show ? 'visible' : 'none')
    }
  }
}

export default function MapView(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const overlayRef = useRef<MapboxOverlay | null>(null)

  const basemap = useStore((s) => s.basemap)
  const region = useStore((s) => s.region)
  const showPlaceLabels = useStore((s) => s.showPlaceLabels)

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current) return

    const centerLon = (region.minLon + region.maxLon) / 2
    const centerLat = (region.minLat + region.maxLat) / 2

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getBasemap(basemap).style as maplibregl.StyleSpecification | string,
      center: [centerLon, centerLat],
      zoom: 4,
      attributionControl: { compact: true }
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')

    const overlay = new MapboxOverlay({
      interleaved: false,
      layers: [],
      // Hover tooltip; reads the live toggle so it can be turned off.
      getTooltip: (info) => (useStore.getState().hoverTooltips ? getTooltip(info) : null)
    })
    map.addControl(overlay)

    mapRef.current = map
    overlayRef.current = overlay

    // Fit to the configured region once loaded.
    map.on('load', () => {
      map.fitBounds(
        [
          [region.minLon, region.minLat],
          [region.maxLon, region.maxLat]
        ],
        { padding: 40, duration: 0 }
      )
    })

    // Publish the viewport so the region picker can "use current view".
    const publishBounds = (): void => {
      const b = map.getBounds()
      useStore.getState().setViewBounds({
        minLat: b.getSouth(),
        minLon: b.getWest(),
        maxLat: b.getNorth(),
        maxLon: b.getEast()
      })
    }
    map.on('moveend', publishBounds)
    map.on('load', publishBounds)

    // Re-apply place-label visibility whenever a style (re)loads.
    map.on('styledata', () => applyPlaceLabels(map, useStore.getState().showPlaceLabels))

    return () => {
      overlay.finalize?.()
      map.remove()
      mapRef.current = null
      overlayRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Swap basemap style when it changes.
  useEffect(() => {
    mapRef.current?.setStyle(getBasemap(basemap).style as maplibregl.StyleSpecification | string)
  }, [basemap])

  // Toggle basemap place/city labels.
  useEffect(() => {
    const map = mapRef.current
    if (map) applyPlaceLabels(map, showPlaceLabels)
  }, [showPlaceLabels])

  // Drive deck.gl every animation frame so dead-reckoned positions advance
  // smoothly. Reading the latest store state each frame also picks up toggle
  // and data changes without a separate subscription.
  useEffect(() => {
    let raf = 0
    const render = (): void => {
      overlayRef.current?.setProps({ layers: buildLayers(useStore.getState(), Date.now()) })
      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <div ref={containerRef} className="map-container" />
}
