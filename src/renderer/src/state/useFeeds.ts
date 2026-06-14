import { useEffect, useRef } from 'react'
import { useStore, type Trail } from './store'
import { inView } from '@/map/layers/satellitesLayer'
import type { Aircraft, Satellite, Ship } from '@/types'
import type { AdsbAircraft, AisShip } from '@shared/types'

const MIN_MOVE_DEG = 0.0005 // ~50m; skip near-duplicate points
const SAT_TRAIL_VIEW_CAP = 600 // safety cap on in-view satellites with tails

function toShip(s: AisShip): Ship {
  return {
    id: s.id,
    lat: s.lat,
    lon: s.lon,
    name: s.name,
    speed: s.speed,
    course: s.course,
    heading: s.heading,
    shipType: s.shipType,
    destination: s.destination,
    updated: s.updated
  }
}

function toAircraft(a: AdsbAircraft): Aircraft {
  return {
    id: a.id,
    lat: a.lat,
    lon: a.lon,
    callsign: a.callsign,
    altitude: a.altitude,
    groundSpeed: a.groundSpeed,
    heading: a.heading,
    verticalRate: a.verticalRate,
    squawk: a.squawk,
    onGround: a.onGround,
    updated: a.updated
  }
}

// Appends current positions to per-id breadcrumb trails and prunes vanished ids.
// `wrapGuard` restarts a trail when it crosses the antimeridian (fast satellites)
// so the path doesn't streak straight across the map.
function accumulate(
  store: Map<string, [number, number][]>,
  tracks: { id: string; lon: number; lat: number }[],
  cap: number,
  wrapGuard = false
): Trail[] {
  const seen = new Set<string>()
  for (const t of tracks) {
    seen.add(t.id)
    let arr = store.get(t.id) ?? []
    const last = arr[arr.length - 1]
    if (last && wrapGuard && Math.abs(last[0] - t.lon) > 180) {
      arr = [] // antimeridian crossing — start a fresh segment
    }
    if (!last || Math.abs(last[0] - t.lon) > MIN_MOVE_DEG || Math.abs(last[1] - t.lat) > MIN_MOVE_DEG) {
      arr.push([t.lon, t.lat])
      store.set(t.id, arr)
    }
    while (arr.length > Math.max(2, cap)) arr.shift()
  }
  for (const id of store.keys()) if (!seen.has(id)) store.delete(id)
  return [...store.entries()].map(([id, path]) => ({ id, path }))
}

/**
 * Wires main-process data feeds into the store:
 *  - ADS-B: subscribe to pushes, (re)configure poller on region/toggle change
 *  - AIS: subscribe to pushes + connection status
 *  - Satellites: fetch TLEs on scope change, propagate in a worker
 * Also maintains breadcrumb trails for aircraft and ships.
 */
export function useFeeds(): void {
  const setAircraft = useStore((s) => s.setAircraft)
  const setShips = useStore((s) => s.setShips)
  const setSatellites = useStore((s) => s.setSatellites)
  const setAircraftTrails = useStore((s) => s.setAircraftTrails)
  const setShipTrails = useStore((s) => s.setShipTrails)
  const setSatelliteTrails = useStore((s) => s.setSatelliteTrails)
  const setAisStatus = useStore((s) => s.setAisStatus)
  const region = useStore((s) => s.region)
  const aircraftOn = useStore((s) => s.layers.aircraft)
  const shipsOn = useStore((s) => s.layers.ships)
  const aisKey = useStore((s) => s.aisKey)
  const satellitesOn = useStore((s) => s.layers.satellites)
  const satScope = useStore((s) => s.satScope)
  const satGroups = useStore((s) => s.satGroups)
  const satFavorites = useStore((s) => s.satFavorites)

  const workerRef = useRef<Worker | null>(null)
  const aircraftTrailRef = useRef(new Map<string, [number, number][]>())
  const shipTrailRef = useRef(new Map<string, [number, number][]>())
  const satTrailRef = useRef(new Map<string, [number, number][]>())

  // --- ADS-B ---
  useEffect(() => {
    return window.projector.adsb.onUpdate((list) => {
      const aircraft = list.map(toAircraft)
      setAircraft(aircraft)
      const cap = useStore.getState().trailLengths.aircraft
      setAircraftTrails(accumulate(aircraftTrailRef.current, aircraft, cap))
    })
  }, [setAircraft, setAircraftTrails])

  useEffect(() => {
    window.projector.adsb.configure(region, aircraftOn)
    if (!aircraftOn) {
      setAircraft([])
      aircraftTrailRef.current.clear()
      setAircraftTrails([])
    }
  }, [region, aircraftOn, setAircraft, setAircraftTrails])

  // --- AIS ships ---
  useEffect(() => {
    const offUpdate = window.projector.ais.onUpdate((list) => {
      const ships = list.map(toShip)
      setShips(ships)
      const cap = useStore.getState().trailLengths.ships
      setShipTrails(accumulate(shipTrailRef.current, ships, cap))
    })
    const offStatus = window.projector.ais.onStatus((e) => setAisStatus(e))
    return () => {
      offUpdate()
      offStatus()
    }
  }, [setShips, setShipTrails, setAisStatus])

  useEffect(() => {
    window.projector.ais.configure(region, aisKey, shipsOn)
    if (!shipsOn) {
      setShips([])
      shipTrailRef.current.clear()
      setShipTrails([])
    }
  }, [region, aisKey, shipsOn, setShips, setShipTrails])

  // --- Satellites: create the propagation worker once ---
  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/satellitePropagator.worker.ts', import.meta.url),
      { type: 'module' }
    )
    worker.onmessage = (e: MessageEvent) => {
      const data = e.data as { type: string; sats?: Satellite[] }
      if (data.type !== 'positions') return
      const sats = data.sats ?? []
      setSatellites(sats)
      // Tails only for satellites currently on screen (the global catalog is
      // far too many); cull to the viewport so in-view sats get clean tails.
      const { viewBounds, trailLengths } = useStore.getState()
      const visible = sats.filter((s) => inView(s.lat, s.lon, viewBounds))
      if (visible.length > 0 && visible.length <= SAT_TRAIL_VIEW_CAP) {
        setSatelliteTrails(
          accumulate(satTrailRef.current, visible, trailLengths.satellites, true)
        )
      } else if (satTrailRef.current.size > 0) {
        satTrailRef.current.clear()
        setSatelliteTrails([])
      }
    }
    workerRef.current = worker
    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [setSatellites, setSatelliteTrails])

  // --- Satellites: fetch TLEs whenever scope/groups/favorites/toggle change ---
  useEffect(() => {
    const worker = workerRef.current
    if (!worker) return

    if (!satellitesOn) {
      worker.postMessage({ type: 'tles', records: [] })
      setSatellites([])
      satTrailRef.current.clear()
      setSatelliteTrails([])
      return
    }

    let cancelled = false
    window.projector.tle
      .fetch(satScope, satGroups, satFavorites)
      .then((records) => {
        if (!cancelled) worker.postMessage({ type: 'tles', records })
      })
      .catch((err) => console.error('[tle] fetch failed', err))

    return () => {
      cancelled = true
    }
  }, [satellitesOn, satScope, satGroups, satFavorites, setSatellites, setSatelliteTrails])
}
