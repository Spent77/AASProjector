import type { StyleSpecification } from 'maplibre-gl'

export interface Basemap {
  id: string
  label: string
  /** A MapLibre style URL or an inline style object. */
  style: string | StyleSpecification
  /** True for light backgrounds (affects default label/halo colors). */
  light?: boolean
}

// Helper to build a single-source raster style from an XYZ tile template.
function rasterStyle(
  tiles: string[],
  attribution: string,
  maxzoom = 19
): StyleSpecification {
  return {
    version: 8,
    glyphs: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/{fontstack}/{range}.pbf',
    sources: {
      raster: {
        type: 'raster',
        tiles,
        tileSize: 256,
        maxzoom,
        attribution
      }
    },
    layers: [{ id: 'raster', type: 'raster', source: 'raster' }]
  }
}

// All keyless by default. MapTiler styles can be appended at runtime when a key is set.
export const BASEMAPS: Basemap[] = [
  {
    id: 'dark',
    label: 'Dark',
    style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
  },
  {
    id: 'light',
    label: 'Light',
    light: true,
    style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
  },
  {
    id: 'streets',
    label: 'Streets',
    light: true,
    style: rasterStyle(
      ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      '© OpenStreetMap contributors',
      19
    )
  },
  {
    id: 'satellite',
    label: 'Satellite',
    style: rasterStyle(
      [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      'Esri, Maxar, Earthstar Geographics',
      19
    )
  }
]

/** Build a MapTiler vector style URL (only used when a key is provided). */
export function maptilerStyle(styleName: string, key: string): string {
  return `https://api.maptiler.com/maps/${styleName}/style.json?key=${key}`
}

export function getBasemap(id: string): Basemap {
  return BASEMAPS.find((b) => b.id === id) ?? BASEMAPS[0]
}
