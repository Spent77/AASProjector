// ADS-B aircraft polling against the airplanes.live REST API.
// Endpoint: https://api.airplanes.live/v2/point/{lat}/{lon}/{radius_nmi}
// Rate limit is ~1 req/sec; we poll every 2s for one region to stay well under.

import type { BBox, AdsbAircraft } from '../../shared/types'

export type { AdsbAircraft }

const POLL_MS = 2000
const MAX_RADIUS_NMI = 250
const USER_AGENT = 'Projector/0.1 (personal display app)'

// Rough nautical-mile radius that covers a bounding box from its center.
function radiusForBBox(b: BBox): number {
  const latSpanNmi = (b.maxLat - b.minLat) * 60 // 1° lat ≈ 60 nmi
  const midLat = (b.minLat + b.maxLat) / 2
  const lonSpanNmi = (b.maxLon - b.minLon) * 60 * Math.cos((midLat * Math.PI) / 180)
  const half = Math.max(latSpanNmi, lonSpanNmi) / 2
  return Math.min(Math.ceil(half) || 50, MAX_RADIUS_NMI)
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function normalize(raw: Record<string, unknown>): AdsbAircraft | null {
  const lat = num(raw.lat)
  const lon = num(raw.lon)
  const id = typeof raw.hex === 'string' ? raw.hex : null
  if (lat === null || lon === null || !id) return null

  const altRaw = raw.alt_baro
  const onGround = altRaw === 'ground'
  const altitude = onGround ? null : num(altRaw)

  const flight = typeof raw.flight === 'string' ? raw.flight.trim() : undefined

  return {
    id,
    lat,
    lon,
    callsign: flight || undefined,
    altitude,
    groundSpeed: num(raw.gs),
    heading: num(raw.track) ?? num(raw.true_heading),
    verticalRate: num(raw.baro_rate) ?? num(raw.geom_rate),
    squawk: typeof raw.squawk === 'string' ? raw.squawk : undefined,
    onGround,
    updated: Date.now()
  }
}

export class AdsbPoller {
  private timer: NodeJS.Timeout | null = null
  private region: BBox | null = null
  private enabled = false
  private inflight = false

  constructor(private onUpdate: (aircraft: AdsbAircraft[]) => void) {}

  configure(region: BBox, enabled: boolean): void {
    this.region = region
    this.enabled = enabled
    if (enabled) this.start()
    else this.stop()
  }

  private start(): void {
    if (this.timer) return
    void this.tick()
    this.timer = setInterval(() => void this.tick(), POLL_MS)
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private async tick(): Promise<void> {
    if (!this.enabled || !this.region || this.inflight) return
    this.inflight = true
    try {
      const b = this.region
      const lat = (b.minLat + b.maxLat) / 2
      const lon = (b.minLon + b.maxLon) / 2
      const radius = radiusForBBox(b)
      const url = `https://api.airplanes.live/v2/point/${lat.toFixed(4)}/${lon.toFixed(4)}/${radius}`

      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as { ac?: Record<string, unknown>[] }
      const list = Array.isArray(json.ac) ? json.ac : []
      const aircraft = list
        .map(normalize)
        .filter((a): a is AdsbAircraft => a !== null)
      this.onUpdate(aircraft)
    } catch (err) {
      console.error('[adsb] poll failed:', (err as Error).message)
    } finally {
      this.inflight = false
    }
  }
}
