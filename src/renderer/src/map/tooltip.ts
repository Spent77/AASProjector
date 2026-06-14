import type { PickingInfo } from '@deck.gl/core'
import type { Aircraft, Ship, Satellite } from '@/types'

// Builds the hover tooltip for a picked contact. Shows the full detail set
// regardless of which on-map label fields are enabled.

function esc(s: string): string {
  return s.replace(/[&<>]/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'))
}

function row(label: string, value: string): string {
  return `<div class="tt-row"><span class="tt-k">${label}</span><span class="tt-v">${esc(value)}</span></div>`
}

function aircraftRows(d: Aircraft): string {
  const rows: string[] = []
  if (d.altitude != null) rows.push(row('Alt', `${Math.round(d.altitude)} ft`))
  else if (d.onGround) rows.push(row('Alt', 'on ground'))
  if (d.groundSpeed != null) rows.push(row('Speed', `${Math.round(d.groundSpeed)} kt`))
  if (d.heading != null) rows.push(row('Track', `${Math.round(d.heading)}°`))
  if (d.verticalRate != null && Math.abs(d.verticalRate) > 64)
    rows.push(row('V/S', `${d.verticalRate > 0 ? '+' : ''}${Math.round(d.verticalRate)} fpm`))
  if (d.squawk) rows.push(row('Squawk', d.squawk))
  rows.push(row('ICAO', d.id.toUpperCase()))
  return rows.join('')
}

function shipRows(d: Ship): string {
  const rows: string[] = []
  if (d.speed != null) rows.push(row('Speed', `${d.speed.toFixed(1)} kt`))
  if (d.course != null) rows.push(row('Course', `${Math.round(d.course)}°`))
  if (d.heading != null) rows.push(row('Heading', `${Math.round(d.heading)}°`))
  if (d.shipType) rows.push(row('Type', d.shipType))
  if (d.destination) rows.push(row('Dest', d.destination))
  rows.push(row('MMSI', d.id))
  return rows.join('')
}

function satelliteRows(d: Satellite): string {
  return [
    row('Group', d.group),
    row('Alt', `${Math.round(d.altitude)} km`),
    row('Speed', `${d.velocity.toFixed(2)} km/s`),
    row('NORAD', d.id)
  ].join('')
}

const TOOLTIP_STYLE = {
  background: 'rgba(11, 15, 20, 0.94)',
  border: '1px solid #2a3a4d',
  borderRadius: '8px',
  color: '#e6edf3',
  font: "12px 'Segoe UI', system-ui, sans-serif",
  padding: '8px 10px',
  pointerEvents: 'none',
  boxShadow: '0 4px 14px rgba(0,0,0,0.45)'
}

export function getTooltip(info: PickingInfo): { html: string; style: typeof TOOLTIP_STYLE } | null {
  const { object, layer } = info
  if (!object || !layer) return null

  let title = ''
  let body = ''
  if (layer.id.startsWith('aircraft')) {
    const d = object as Aircraft
    title = `✈ ${d.callsign || d.id.toUpperCase()}`
    body = aircraftRows(d)
  } else if (layer.id.startsWith('ship')) {
    const d = object as Ship
    title = `🚢 ${d.name || d.id}`
    body = shipRows(d)
  } else if (layer.id.startsWith('satellite')) {
    const d = object as Satellite
    title = `🛰 ${d.name}`
    body = satelliteRows(d)
  } else {
    return null
  }

  return {
    html: `<div class="tt-title">${esc(title)}</div>${body}`,
    style: TOOLTIP_STYLE
  }
}
