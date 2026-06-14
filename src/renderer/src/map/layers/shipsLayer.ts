import { IconLayer, TextLayer } from '@deck.gl/layers'
import type { Layer } from '@deck.gl/core'
import { SHIP_ICON, ICON_MAPPING } from '../icons'
import { deadReckon } from '../deadReckon'
import type { Ship, FieldToggles } from '@/types'

const TYPE_COLORS: Record<string, [number, number, number]> = {
  Passenger: [120, 220, 120],
  Cargo: [120, 170, 255],
  Tanker: [255, 140, 90],
  'High-speed': [255, 220, 120],
  'Fishing/Tug': [200, 160, 255],
  Other: [160, 180, 200]
}

function shipColor(type: string | undefined): [number, number, number] {
  return (type && TYPE_COLORS[type]) || [120, 200, 200]
}

function pos(d: Ship, now: number): [number, number] {
  return deadReckon(d.lat, d.lon, d.speed, d.heading ?? d.course, d.updated, now)
}

function label(d: Ship, f: FieldToggles['ships']): string {
  const parts: string[] = []
  if (f.name) parts.push(d.name || d.id)
  if (f.speed && d.speed != null) parts.push(`${d.speed.toFixed(1)}kt`)
  if (f.course && d.course != null) parts.push(`${Math.round(d.course)}°`)
  if (f.shipType && d.shipType) parts.push(d.shipType)
  if (f.destination && d.destination) parts.push(`→${d.destination}`)
  return parts.join('\n')
}

const anyField = (f: FieldToggles['ships']): boolean => Object.values(f).some(Boolean)

export function shipLayers(
  data: Ship[],
  fields: FieldToggles['ships'],
  showLabels: boolean,
  now: number,
  labelSize: number,
  iconSize: number
): Layer[] {
  const layers: Layer[] = [
    new IconLayer<Ship>({
      id: 'ship-icons',
      data,
      iconAtlas: SHIP_ICON,
      iconMapping: ICON_MAPPING,
      getIcon: () => 'marker',
      sizeUnits: 'pixels',
      getSize: iconSize,
      getPosition: (d) => pos(d, now),
      // Point the bow along heading (fall back to course over ground).
      getAngle: (d) => -((d.heading ?? d.course) ?? 0),
      getColor: (d) => shipColor(d.shipType),
      pickable: true,
      updateTriggers: { getPosition: now, getSize: iconSize }
    })
  ]

  if (showLabels && anyField(fields)) {
    layers.push(
      new TextLayer<Ship>({
        id: 'ship-labels',
        data,
        getPosition: (d) => pos(d, now),
        getText: (d) => label(d, fields),
        getSize: labelSize,
        getColor: [210, 235, 235],
        getPixelOffset: [0, -18],
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'bottom',
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        outlineWidth: 2,
        outlineColor: [4, 8, 14, 255],
        fontSettings: { sdf: true },
        updateTriggers: { getPosition: now, getText: fields, getSize: labelSize }
      })
    )
  }

  return layers
}
