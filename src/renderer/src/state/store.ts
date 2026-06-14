import { create } from 'zustand'
import type {
  Aircraft,
  BBox,
  FieldToggles,
  LayerId,
  SatelliteScopeMode,
  Satellite,
  Ship
} from '@/types'
import type { AisStatusEvent } from '@shared/types'

export interface Trail {
  id: string
  path: [number, number][] // [lon, lat] breadcrumbs, oldest first
}

// Default region: continental US-ish bounding box. User can change via RegionPicker.
const DEFAULT_REGION: BBox = {
  minLat: 24,
  minLon: -125,
  maxLat: 50,
  maxLon: -66
}

const DEFAULT_FIELDS: FieldToggles = {
  aircraft: {
    callsign: true,
    altitude: true,
    groundSpeed: false,
    heading: false,
    verticalRate: false,
    squawk: false
  },
  ships: {
    name: true,
    speed: false,
    course: false,
    shipType: false,
    destination: false
  },
  satellites: {
    name: true,
    altitude: false,
    velocity: false,
    group: false
  }
}

export interface AppState {
  // --- configuration (rarely changes) ---
  basemap: string
  maptilerKey: string | null
  aisKey: string
  layers: Record<LayerId, boolean>
  fields: FieldToggles
  region: BBox
  viewBounds: BBox | null // current map viewport, for "use current view"
  showLabels: boolean
  showTracks: boolean
  showPlaceLabels: boolean // basemap city/place names
  airborneLabelsOnly: boolean // hide labels for aircraft on the ground
  // Appearance, per layer.
  labelSizes: Record<LayerId, number> // label text px
  iconSizes: Record<LayerId, number> // marker px (dot radius for satellites)
  maxContacts: Record<LayerId, number> // max tracks rendered per type
  trailLengths: Record<LayerId, number> // breadcrumbs kept
  trailColors: Record<LayerId, string> // hex like "#4ea1ff"

  // satellites
  satScope: SatelliteScopeMode
  satGroups: string[] // selected curated group keys
  satFavorites: string[] // NORAD ids

  // --- live track data (high frequency) ---
  aircraft: Aircraft[]
  ships: Ship[]
  satellites: Satellite[]
  aircraftTrails: Trail[]
  shipTrails: Trail[]
  satelliteTrails: Trail[]

  // --- liveness / status ---
  lastAdsbAt: number | null
  lastAisAt: number | null
  aisStatus: AisStatusEvent

  // --- actions ---
  setBasemap: (id: string) => void
  setMaptilerKey: (key: string | null) => void
  setAisKey: (key: string) => void
  toggleLayer: (id: LayerId) => void
  setLayer: (id: LayerId, on: boolean) => void
  toggleField: <L extends keyof FieldToggles>(layer: L, field: keyof FieldToggles[L]) => void
  setRegion: (b: BBox) => void
  setViewBounds: (b: BBox) => void
  setShowLabels: (v: boolean) => void
  setShowTracks: (v: boolean) => void
  setShowPlaceLabels: (v: boolean) => void
  setAirborneLabelsOnly: (v: boolean) => void
  setLabelSize: (layer: LayerId, n: number) => void
  setIconSize: (layer: LayerId, n: number) => void
  setMaxContacts: (layer: LayerId, n: number) => void
  setTrailLength: (layer: LayerId, n: number) => void
  setTrailColor: (layer: LayerId, hex: string) => void
  setSatScope: (m: SatelliteScopeMode) => void
  setSatGroups: (g: string[]) => void
  setSatFavorites: (ids: string[]) => void

  setAircraft: (a: Aircraft[]) => void
  setShips: (s: Ship[]) => void
  setSatellites: (s: Satellite[]) => void
  setAircraftTrails: (t: Trail[]) => void
  setShipTrails: (t: Trail[]) => void
  setSatelliteTrails: (t: Trail[]) => void
  setAisStatus: (e: AisStatusEvent) => void
  hydrate: (cfg: Partial<AppState>) => void
}

export const useStore = create<AppState>((set) => ({
  basemap: 'dark',
  maptilerKey: null,
  aisKey: '',
  layers: { aircraft: true, ships: true, satellites: true },
  fields: DEFAULT_FIELDS,
  region: DEFAULT_REGION,
  viewBounds: null,
  showLabels: true,
  showTracks: false,
  showPlaceLabels: true,
  airborneLabelsOnly: false,
  labelSizes: { aircraft: 12, ships: 11, satellites: 11 },
  iconSizes: { aircraft: 22, ships: 18, satellites: 3 },
  maxContacts: { aircraft: 1000, ships: 1000, satellites: 12000 },
  trailLengths: { aircraft: 30, ships: 30, satellites: 40 },
  trailColors: { aircraft: '#78aaff', ships: '#78c8c8', satellites: '#ffb478' },

  satScope: 'curated',
  satGroups: ['stations', 'visual'],
  satFavorites: ['25544'], // ISS (ZARYA)

  aircraft: [],
  ships: [],
  satellites: [],
  aircraftTrails: [],
  shipTrails: [],
  satelliteTrails: [],

  lastAdsbAt: null,
  lastAisAt: null,
  aisStatus: { status: 'closed' },

  setBasemap: (id) => set({ basemap: id }),
  setMaptilerKey: (key) => set({ maptilerKey: key }),
  setAisKey: (key) => set({ aisKey: key }),
  toggleLayer: (id) => set((s) => ({ layers: { ...s.layers, [id]: !s.layers[id] } })),
  setLayer: (id, on) => set((s) => ({ layers: { ...s.layers, [id]: on } })),
  toggleField: (layer, field) =>
    set((s) => ({
      fields: {
        ...s.fields,
        [layer]: {
          ...s.fields[layer],
          [field]: !(s.fields[layer] as Record<string, boolean>)[field as string]
        }
      }
    })),
  setRegion: (b) => set({ region: b }),
  setViewBounds: (b) => set({ viewBounds: b }),
  setShowLabels: (v) => set({ showLabels: v }),
  setShowTracks: (v) => set({ showTracks: v }),
  setShowPlaceLabels: (v) => set({ showPlaceLabels: v }),
  setAirborneLabelsOnly: (v) => set({ airborneLabelsOnly: v }),
  setLabelSize: (layer, n) =>
    set((s) => ({ labelSizes: { ...s.labelSizes, [layer]: n } })),
  setIconSize: (layer, n) =>
    set((s) => ({ iconSizes: { ...s.iconSizes, [layer]: n } })),
  setMaxContacts: (layer, n) =>
    set((s) => ({ maxContacts: { ...s.maxContacts, [layer]: n } })),
  setTrailLength: (layer, n) =>
    set((s) => ({ trailLengths: { ...s.trailLengths, [layer]: n } })),
  setTrailColor: (layer, hex) =>
    set((s) => ({ trailColors: { ...s.trailColors, [layer]: hex } })),
  setSatScope: (m) => set({ satScope: m }),
  setSatGroups: (g) => set({ satGroups: g }),
  setSatFavorites: (ids) => set({ satFavorites: ids }),

  setAircraft: (a) => set({ aircraft: a, lastAdsbAt: Date.now() }),
  setShips: (s) =>
    set(s.length > 0 ? { ships: s, lastAisAt: Date.now() } : { ships: s }),
  setSatellites: (s) => set({ satellites: s }),
  setAircraftTrails: (t) => set({ aircraftTrails: t }),
  setShipTrails: (t) => set({ shipTrails: t }),
  setSatelliteTrails: (t) => set({ satelliteTrails: t }),
  setAisStatus: (e) => set({ aisStatus: e }),
  hydrate: (cfg) => set(cfg)
}))
