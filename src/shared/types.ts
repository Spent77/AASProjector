// Types shared across main / preload / renderer (the IPC wire contract).

export interface BBox {
  minLat: number
  minLon: number
  maxLat: number
  maxLon: number
}

/** Aircraft as emitted by the main-process ADS-B poller. */
export interface AdsbAircraft {
  id: string
  lat: number
  lon: number
  callsign?: string
  altitude: number | null
  groundSpeed: number | null
  heading: number | null
  verticalRate: number | null
  squawk?: string
  onGround: boolean
  updated: number
}

/** Vessel as emitted by the main-process AIS stream. */
export interface AisShip {
  id: string // MMSI
  lat: number
  lon: number
  name?: string
  speed: number | null
  course: number | null
  heading: number | null
  shipType?: string
  destination?: string
  updated: number
}

/** AIS connection status surfaced to the UI. */
export type AisStatus = 'no-key' | 'connecting' | 'open' | 'closed' | 'error'

export interface AisStatusEvent {
  status: AisStatus
  detail?: string
}

/** One TLE/OMM record handed to the renderer for propagation. */
export interface TleRecord {
  id: string // NORAD id
  name: string
  group: string
  line1: string
  line2: string
}
