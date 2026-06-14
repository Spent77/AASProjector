import type { BBox } from './types'

// Persisted settings shape, shared across processes (defined here so neither
// the renderer nor preload need to import main-process modules).
export interface PersistedSettings {
  aisKey: string
  maptilerKey: string
  basemap: string
  region: BBox
  showLabels: boolean
  showTracks: boolean
  showPlaceLabels: boolean
  airborneLabelsOnly: boolean
  hoverTooltips: boolean
  labelSizes: { aircraft: number; ships: number; satellites: number }
  iconSizes: { aircraft: number; ships: number; satellites: number }
  maxContacts: { aircraft: number; ships: number; satellites: number }
  trailLengths: { aircraft: number; ships: number; satellites: number }
  trailColors: { aircraft: string; ships: string; satellites: string }
  layers: { aircraft: boolean; ships: boolean; satellites: boolean }
  satScope: string
  satGroups: string[]
  satFavorites: string[]
  // Field toggles stored as an opaque blob to avoid coupling the schema here.
  fields: Record<string, Record<string, boolean>>
}

export const DEFAULT_SETTINGS: PersistedSettings = {
  aisKey: '',
  maptilerKey: '',
  basemap: 'dark',
  region: { minLat: 24, minLon: -125, maxLat: 50, maxLon: -66 },
  showLabels: true,
  showTracks: false,
  showPlaceLabels: true,
  airborneLabelsOnly: false,
  hoverTooltips: true,
  labelSizes: { aircraft: 12, ships: 11, satellites: 11 },
  iconSizes: { aircraft: 22, ships: 18, satellites: 3 },
  maxContacts: { aircraft: 1000, ships: 1000, satellites: 12000 },
  trailLengths: { aircraft: 30, ships: 30, satellites: 40 },
  trailColors: { aircraft: '#78aaff', ships: '#78c8c8', satellites: '#ffb478' },
  layers: { aircraft: true, ships: true, satellites: true },
  satScope: 'curated',
  satGroups: ['stations', 'visual'],
  satFavorites: ['25544'],
  fields: {}
}
