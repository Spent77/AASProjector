import { PathLayer } from '@deck.gl/layers'
import type { Layer } from '@deck.gl/core'
import type { Trail } from '@/state/store'

export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return [255, 255, 255]
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// Draws breadcrumb trails (recent position history) for a set of tracks.
export function trailLayer(id: string, trails: Trail[], hex: string): Layer {
  const [r, g, b] = hexToRgb(hex)
  return new PathLayer<Trail>({
    id,
    data: trails,
    getPath: (d) => d.path,
    getColor: [r, g, b, 150],
    getWidth: 1.5,
    widthUnits: 'pixels',
    widthMinPixels: 1,
    capRounded: true,
    jointRounded: true,
    pickable: false,
    updateTriggers: { getColor: hex }
  })
}
