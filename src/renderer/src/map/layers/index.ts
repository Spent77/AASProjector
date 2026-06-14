import type { Layer } from '@deck.gl/core'
import type { AppState } from '@/state/store'
import { aircraftLayers } from './aircraftLayer'
import { satelliteLayers, inView } from './satellitesLayer'
import { shipLayers } from './shipsLayer'
import { trailLayer } from './trailLayer'
import type { Satellite } from '@/types'

// Caps satellites to `max`, keeping in-view ones first so the visible sky is
// never dropped in favor of off-screen objects.
function capSatellites(sats: Satellite[], max: number, view: AppState['viewBounds']): Satellite[] {
  if (sats.length <= max) return sats
  const visible = sats.filter((d) => inView(d.lat, d.lon, view))
  if (visible.length >= max) return visible.slice(0, max)
  const rest = sats.filter((d) => !inView(d.lat, d.lon, view))
  return visible.concat(rest.slice(0, max - visible.length))
}

/**
 * Builds the deck.gl layer stack from current app state at time `now`.
 * `now` (epoch ms) drives dead-reckoned motion between feed updates.
 * Trails render first so live icons sit on top.
 */
export function buildLayers(state: AppState, now: number): Layer[] {
  const layers: Layer[] = []

  if (state.showTracks) {
    if (state.layers.aircraft) {
      layers.push(trailLayer('aircraft-trails', state.aircraftTrails, state.trailColors.aircraft))
    }
    if (state.layers.ships) {
      layers.push(trailLayer('ship-trails', state.shipTrails, state.trailColors.ships))
    }
    if (state.layers.satellites) {
      layers.push(trailLayer('satellite-trails', state.satelliteTrails, state.trailColors.satellites))
    }
  }

  if (state.layers.aircraft) {
    const data = state.aircraft.slice(0, state.maxContacts.aircraft)
    layers.push(
      ...aircraftLayers(
        data,
        state.fields.aircraft,
        state.showLabels,
        now,
        state.labelSizes.aircraft,
        state.iconSizes.aircraft,
        state.airborneLabelsOnly
      )
    )
  }
  if (state.layers.ships) {
    const data = state.ships.slice(0, state.maxContacts.ships)
    layers.push(
      ...shipLayers(
        data,
        state.fields.ships,
        state.showLabels,
        now,
        state.labelSizes.ships,
        state.iconSizes.ships
      )
    )
  }
  if (state.layers.satellites) {
    const data = capSatellites(state.satellites, state.maxContacts.satellites, state.viewBounds)
    layers.push(
      ...satelliteLayers(
        data,
        state.fields.satellites,
        state.showLabels,
        state.viewBounds,
        state.labelSizes.satellites,
        state.iconSizes.satellites
      )
    )
  }

  return layers
}
