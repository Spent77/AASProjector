import { ScatterplotLayer, TextLayer } from '@deck.gl/layers'
import type { Layer } from '@deck.gl/core'
import type { Satellite, FieldToggles, BBox } from '@/types'

// Labels are culled to the viewport (with margin) so they stay readable even
// when the full catalog of ~10k satellites is loaded.
const LABEL_VIEW_CAP = 400

const GROUP_COLORS: Record<string, [number, number, number]> = {
  stations: [255, 90, 90],
  visual: [255, 255, 255],
  starlink: [120, 200, 255],
  'gps-ops': [180, 140, 255],
  galileo: [160, 160, 255],
  'glo-ops': [200, 120, 255],
  weather: [120, 255, 180],
  noaa: [120, 255, 200],
  goes: [120, 255, 220],
  science: [255, 200, 120],
  geo: [255, 220, 120],
  amateur: [255, 160, 200],
  favorites: [255, 90, 90],
  active: [255, 170, 90]
}

function satColor(group: string): [number, number, number] {
  return GROUP_COLORS[group] ?? [255, 170, 90]
}

function label(d: Satellite, f: FieldToggles['satellites']): string {
  const parts: string[] = []
  if (f.name) parts.push(d.name)
  if (f.altitude) parts.push(`${Math.round(d.altitude)}km`)
  if (f.velocity) parts.push(`${d.velocity.toFixed(2)}km/s`)
  if (f.group) parts.push(d.group)
  return parts.join('\n')
}

const anyField = (f: FieldToggles['satellites']): boolean =>
  Object.values(f).some(Boolean)

export function inView(lat: number, lon: number, b: BBox | null, margin = 5): boolean {
  if (!b) return true
  return (
    lat >= b.minLat - margin &&
    lat <= b.maxLat + margin &&
    lon >= b.minLon - margin &&
    lon <= b.maxLon + margin
  )
}

export function satelliteLayers(
  data: Satellite[],
  fields: FieldToggles['satellites'],
  showLabels: boolean,
  viewBounds: BBox | null,
  labelSize: number,
  dotRadius: number
): Layer[] {
  // ScatterplotLayer renders 10k+ points reliably and cheaply (vs an icon atlas).
  const layers: Layer[] = [
    new ScatterplotLayer<Satellite>({
      id: 'satellite-dots',
      data,
      getPosition: (d) => [d.lon, d.lat],
      getFillColor: (d) => satColor(d.group),
      getRadius: dotRadius,
      radiusUnits: 'pixels',
      radiusMinPixels: 1.5,
      stroked: false,
      pickable: true,
      updateTriggers: { getRadius: dotRadius }
    })
  ]

  if (showLabels && anyField(fields)) {
    const visible = data.filter((d) => inView(d.lat, d.lon, viewBounds))
    if (visible.length <= LABEL_VIEW_CAP) {
      layers.push(
        new TextLayer<Satellite>({
          id: 'satellite-labels',
          data: visible,
          getPosition: (d) => [d.lon, d.lat],
          getText: (d) => label(d, fields),
          getSize: labelSize,
          getColor: [210, 225, 240],
          getPixelOffset: [0, -14],
          getTextAnchor: 'middle',
          getAlignmentBaseline: 'bottom',
          fontFamily: 'Segoe UI, system-ui, sans-serif',
          outlineWidth: 2,
          outlineColor: [4, 8, 14, 255],
          fontSettings: { sdf: true },
          updateTriggers: { getText: fields, getSize: labelSize }
        })
      )
    }
  }

  return layers
}
