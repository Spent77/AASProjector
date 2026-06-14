// Shared track + state types across the renderer.

export type { SatelliteScopeMode } from '@shared/satellites'

export type LayerId = 'aircraft' | 'ships' | 'satellites'

export interface BBox {
  minLat: number
  minLon: number
  maxLat: number
  maxLon: number
}

/** A tracked aircraft (from ADS-B). Distances in feet/knots as the feeds provide. */
export interface Aircraft {
  id: string // ICAO hex
  lat: number
  lon: number
  callsign?: string
  altitude?: number | null // feet (baro), null when on ground/unknown
  groundSpeed?: number | null // knots
  heading?: number | null // track, degrees
  verticalRate?: number | null // ft/min
  squawk?: string
  onGround?: boolean
  updated: number // epoch ms (client receive time)
}

/** A tracked vessel (from AIS). */
export interface Ship {
  id: string // MMSI
  lat: number
  lon: number
  name?: string
  speed?: number | null // knots (SOG)
  course?: number | null // COG degrees
  heading?: number | null // true heading degrees
  shipType?: string
  destination?: string
  updated: number
}

/** A satellite position (propagated from TLE/OMM). */
export interface Satellite {
  id: string // NORAD id
  name: string
  group: string // celestrak group key
  lat: number
  lon: number
  altitude: number // km
  velocity: number // km/s
}

export type TrackKind = LayerId

/** Selectable label fields, per layer. */
export interface FieldToggles {
  aircraft: {
    callsign: boolean
    altitude: boolean
    groundSpeed: boolean
    heading: boolean
    verticalRate: boolean
    squawk: boolean
  }
  ships: {
    name: boolean
    speed: boolean
    course: boolean
    shipType: boolean
    destination: boolean
  }
  satellites: {
    name: boolean
    altitude: boolean
    velocity: boolean
    group: boolean
  }
}
