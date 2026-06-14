// Propagates satellites from TLEs using SGP4 (satellite.js), off the main
// thread. Receives TLE records, emits geodetic positions ~1 Hz.

import {
  twoline2satrec,
  propagate,
  gstime,
  eciToGeodetic,
  degreesLat,
  degreesLong,
  type SatRec,
  type EciVec3
} from 'satellite.js'
import type { TleRecord } from '@shared/types'
import type { Satellite } from '@/types'

const ctx = self as unknown as DedicatedWorkerGlobalScope

interface Rec {
  id: string
  name: string
  group: string
  satrec: SatRec
}

let recs: Rec[] = []
let timer: ReturnType<typeof setInterval> | null = null

// Smaller sets propagate more often so motion looks smooth; the full catalog
// stays at 1 Hz to bound CPU cost.
function tickInterval(count: number): number {
  if (count <= 300) return 250
  if (count <= 1500) return 500
  return 1000
}

function tick(): void {
  const now = new Date()
  const gmst = gstime(now)
  const sats: Satellite[] = []

  for (const r of recs) {
    let pv
    try {
      pv = propagate(r.satrec, now)
    } catch {
      continue
    }
    const position = pv?.position
    if (!position || typeof position === 'boolean') continue

    const geo = eciToGeodetic(position as EciVec3<number>, gmst)
    const lat = degreesLat(geo.latitude)
    const lon = degreesLong(geo.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue

    const v = pv?.velocity
    const velocity =
      v && typeof v !== 'boolean'
        ? Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
        : 0

    sats.push({
      id: r.id,
      name: r.name,
      group: r.group,
      lat,
      lon,
      altitude: geo.height,
      velocity
    })
  }

  ctx.postMessage({ type: 'positions', sats })
}

ctx.onmessage = (e: MessageEvent): void => {
  const data = e.data as { type: string; records?: TleRecord[] }
  if (data.type === 'tles') {
    recs = (data.records ?? [])
      .map((r) => ({
        id: r.id,
        name: r.name,
        group: r.group,
        satrec: twoline2satrec(r.line1, r.line2)
      }))
      .filter((r) => !r.satrec.error)

    if (timer) {
      clearInterval(timer)
      timer = null
    }
    if (recs.length > 0) {
      tick()
      timer = setInterval(tick, tickInterval(recs.length))
    } else {
      ctx.postMessage({ type: 'positions', sats: [] })
    }
  }
}
