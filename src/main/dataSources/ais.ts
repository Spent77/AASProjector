// AIS vessel stream via AISStream.io (wss). Subscribes to the current region's
// bounding box with the user's API key and forwards decoded position reports.
// Uses the `ws` package — Electron's main process (Node 20) has no global
// WebSocket, so relying on one silently leaves the socket stuck "connecting".

import WebSocket, { type RawData } from 'ws'
import type { BBox, AisShip, AisStatus } from '../../shared/types'

const URL = 'wss://stream.aisstream.io/v0/stream'
const FLUSH_MS = 1000
const STALE_MS = 15 * 60 * 1000 // drop vessels not seen for 15 min
const RECONNECT_MS = 5000

// Condensed AIS ship-type categories from the numeric type code.
function shipTypeLabel(code: unknown): string | undefined {
  if (typeof code !== 'number') return undefined
  if (code >= 60 && code <= 69) return 'Passenger'
  if (code >= 70 && code <= 79) return 'Cargo'
  if (code >= 80 && code <= 89) return 'Tanker'
  if (code >= 40 && code <= 49) return 'High-speed'
  if (code >= 30 && code <= 39) return 'Fishing/Tug'
  if (code === 0) return undefined
  return 'Other'
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

export class AisClient {
  private ws: WebSocket | null = null
  private region: BBox | null = null
  private key = ''
  private enabled = false
  private ships = new Map<string, AisShip>()
  private flushTimer: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  constructor(
    private onUpdate: (ships: AisShip[]) => void,
    private onStatus: (status: AisStatus, detail?: string) => void = () => {}
  ) {}

  configure(region: BBox, key: string, enabled: boolean): void {
    const changed =
      JSON.stringify(region) !== JSON.stringify(this.region) || key !== this.key
    this.region = region
    this.key = key.trim()
    this.enabled = enabled

    if (!enabled) {
      this.disconnect()
      this.ships.clear()
      this.onUpdate([])
      this.onStatus('closed')
      return
    }
    if (!this.key) {
      this.disconnect()
      this.ships.clear()
      this.onUpdate([])
      this.onStatus('no-key')
      return
    }
    if (changed || !this.ws) this.reconnect()
    this.startFlush()
  }

  private startFlush(): void {
    if (this.flushTimer) return
    this.flushTimer = setInterval(() => this.flush(), FLUSH_MS)
  }

  private flush(): void {
    const now = Date.now()
    for (const [id, s] of this.ships) {
      if (now - s.updated > STALE_MS) this.ships.delete(id)
    }
    this.onUpdate([...this.ships.values()])
  }

  private reconnect(): void {
    this.disconnect(false)
    if (!this.enabled || !this.key || !this.region) return

    this.onStatus('connecting')
    const ws = new WebSocket(URL)
    this.ws = ws

    ws.on('open', () => {
      const b = this.region!
      ws.send(
        JSON.stringify({
          APIKey: this.key,
          // AISStream expects [latitude, longitude] corner pairs.
          BoundingBoxes: [
            [
              [b.minLat, b.minLon],
              [b.maxLat, b.maxLon]
            ]
          ],
          FilterMessageTypes: ['PositionReport', 'ShipStaticData']
        })
      )
      this.onStatus('open')
    })

    ws.on('message', (data: RawData) => {
      // `ws` delivers frames as Buffer — decode to text and parse.
      try {
        this.handle(JSON.parse(data.toString('utf8')))
      } catch {
        /* ignore malformed frames */
      }
    })

    ws.on('error', (err: Error) => {
      this.onStatus('error', err.message)
    })

    ws.on('close', () => {
      this.ws = null
      this.onStatus('closed')
      if (this.enabled && this.key) {
        this.reconnectTimer = setTimeout(() => this.reconnect(), RECONNECT_MS)
      }
    })
  }

  private handle(msg: Record<string, any>): void {
    // AISStream sends an error frame (e.g. invalid key) as { error: "..." }.
    const err = msg.error ?? msg.Error
    if (typeof err === 'string') {
      this.onStatus('error', err)
      return
    }

    // Field casing has varied between "MetaData" and "Metadata" — accept both.
    const meta = msg.MetaData ?? msg.Metadata ?? {}
    const body = msg.Message ?? {}
    const pos = body.PositionReport ?? body.StandardClassBPositionReport
    const stat = body.ShipStaticData

    const mmsi = meta.MMSI ?? meta.mmsi ?? pos?.UserID
    if (mmsi == null) return
    const id = String(mmsi)

    const lat = num(meta.latitude) ?? num(meta.Latitude) ?? num(pos?.Latitude)
    const lon = num(meta.longitude) ?? num(meta.Longitude) ?? num(pos?.Longitude)

    const prev = this.ships.get(id)
    const ship: AisShip = prev ?? {
      id,
      lat: lat ?? 0,
      lon: lon ?? 0,
      speed: null,
      course: null,
      heading: null,
      updated: 0
    }

    if (lat !== null && lon !== null && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      ship.lat = lat
      ship.lon = lon
    } else if (!prev) {
      return // no usable position yet
    }

    const name = String(meta.ShipName ?? '').trim()
    if (name) ship.name = name

    if (pos) {
      ship.speed = num(pos.Sog)
      ship.course = num(pos.Cog)
      const hdg = num(pos.TrueHeading)
      ship.heading = hdg !== null && hdg < 360 ? hdg : ship.heading
    }
    if (stat) {
      ship.shipType = shipTypeLabel(stat.Type) ?? ship.shipType
      const dest = String(stat.Destination ?? '').trim()
      if (dest) ship.destination = dest
    }

    ship.updated = Date.now()
    this.ships.set(id, ship)
  }

  private disconnect(stopFlush = true): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.removeAllListeners()
      try {
        this.ws.terminate()
      } catch {
        /* noop */
      }
      this.ws = null
    }
    if (stopFlush && this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
  }

  stop(): void {
    this.enabled = false
    this.disconnect()
    this.ships.clear()
  }
}
