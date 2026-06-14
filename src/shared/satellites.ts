// Curated CelesTrak groups offered in the satellite scope selector.
// `key` is the CelesTrak GROUP query value.

export interface SatGroup {
  key: string
  label: string
}

export const CURATED_GROUPS: SatGroup[] = [
  { key: 'stations', label: 'Space Stations (ISS)' },
  { key: 'visual', label: 'Brightest (visual)' },
  { key: 'starlink', label: 'Starlink' },
  { key: 'gps-ops', label: 'GPS' },
  { key: 'galileo', label: 'Galileo' },
  { key: 'glo-ops', label: 'GLONASS' },
  { key: 'weather', label: 'Weather' },
  { key: 'noaa', label: 'NOAA' },
  { key: 'goes', label: 'GOES' },
  { key: 'science', label: 'Science (Hubble)' },
  { key: 'geo', label: 'Geostationary' },
  { key: 'amateur', label: 'Amateur Radio' }
]

// The full active satellite catalog (~10k objects).
export const FULL_CATALOG_GROUP = 'active'

export type SatelliteScopeMode = 'curated' | 'full' | 'favorites'
