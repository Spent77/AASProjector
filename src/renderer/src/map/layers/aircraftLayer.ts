import { IconLayer, TextLayer } from '@deck.gl/layers'
import type { Layer } from '@deck.gl/core'
import { PLANE_ICON, ICON_MAPPING } from '../icons'
import { deadReckon } from '../deadReckon'
import type { Aircraft, FieldToggles } from '@/types'

// Altitude → color ramp (feet). Low = amber, mid = green, high = cyan.
function altColor(alt: number | null | undefined): [number, number, number] {
  if (alt == null) return [150, 160, 170] // on ground / unknown
  if (alt < 10000) return [255, 196, 0]
  if (alt < 20000) return [120, 220, 120]
  if (alt < 30000) return [90, 200, 220]
  return [120, 170, 255]
}

function pos(d: Aircraft, now: number): [number, number] {
  if (d.onGround) return [d.lon, d.lat]
  return deadReckon(d.lat, d.lon, d.groundSpeed, d.heading, d.updated, now)
}

function label(d: Aircraft, f: FieldToggles['aircraft']): string {
  const parts: string[] = []
  if (f.callsign) parts.push(d.callsign || d.id.toUpperCase())
  if (f.altitude) parts.push(d.altitude == null ? 'GND' : `${Math.round(d.altitude)}ft`)
  if (f.groundSpeed && d.groundSpeed != null) parts.push(`${Math.round(d.groundSpeed)}kt`)
  if (f.heading && d.heading != null) parts.push(`${Math.round(d.heading)}°`)
  if (f.verticalRate && d.verticalRate != null) {
    const arrow = d.verticalRate > 64 ? '▲' : d.verticalRate < -64 ? '▼' : '—'
    parts.push(`${arrow}${Math.abs(Math.round(d.verticalRate))}`)
  }
  if (f.squawk && d.squawk) parts.push(`sq${d.squawk}`)
  return parts.join('\n')
}

const anyField = (f: FieldToggles['aircraft']): boolean =>
  Object.values(f).some(Boolean)

export function aircraftLayers(
  data: Aircraft[],
  fields: FieldToggles['aircraft'],
  showLabels: boolean,
  now: number,
  labelSize: number,
  iconSize: number,
  airborneLabelsOnly: boolean
): Layer[] {
  const layers: Layer[] = [
    new IconLayer<Aircraft>({
      id: 'aircraft-icons',
      data,
      iconAtlas: PLANE_ICON,
      iconMapping: ICON_MAPPING,
      getIcon: () => 'marker',
      sizeUnits: 'pixels',
      getSize: iconSize,
      // Icon points north at 0°; aircraft track is clockwise from north.
      getAngle: (d) => -(d.heading ?? 0),
      getPosition: (d) => pos(d, now),
      getColor: (d) => altColor(d.altitude),
      pickable: true,
      updateTriggers: { getPosition: now, getSize: iconSize }
    })
  ]

  if (showLabels && anyField(fields)) {
    const labelData = airborneLabelsOnly ? data.filter((d) => !d.onGround) : data
    layers.push(
      new TextLayer<Aircraft>({
        id: 'aircraft-labels',
        data: labelData,
        getPosition: (d) => pos(d, now),
        getText: (d) => label(d, fields),
        getSize: labelSize,
        getColor: [230, 237, 243],
        getPixelOffset: [0, -22],
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'bottom',
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        outlineWidth: 2,
        outlineColor: [4, 8, 14, 255],
        fontSettings: { sdf: true },
        background: false,
        updateTriggers: { getPosition: now, getText: fields, getSize: labelSize }
      })
    )
  }

  return layers
}
