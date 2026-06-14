// Icons for deck.gl IconLayers, drawn on a canvas and exported as PNG data URLs.
// PNG rasterizes reliably for WebGL textures (SVG data URLs can rasterize at
// zero size in some environments). Shapes are white so getColor (mask) tints
// them, and point "up" (north / 0°) so getAngle = -heading orients them.

function makeIcon(draw: (ctx: CanvasRenderingContext2D) => void): string {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#ffffff'
  ctx.lineJoin = 'round'
  draw(ctx)
  return canvas.toDataURL('image/png')
}

function polygon(ctx: CanvasRenderingContext2D, pts: [number, number][]): void {
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
  ctx.closePath()
  ctx.fill()
}

// Top-down airplane silhouette, nose up.
export const PLANE_ICON = makeIcon((ctx) =>
  polygon(ctx, [
    [32, 3],
    [35, 26],
    [60, 42],
    [60, 48],
    [35, 39],
    [35, 54],
    [44, 60],
    [44, 63],
    [32, 58],
    [20, 63],
    [20, 60],
    [29, 54],
    [29, 39],
    [4, 48],
    [4, 42],
    [29, 26]
  ])
)

// Boat silhouette, bow up.
export const SHIP_ICON = makeIcon((ctx) =>
  polygon(ctx, [
    [32, 4],
    [43, 26],
    [43, 46],
    [34, 46],
    [34, 60],
    [30, 60],
    [30, 46],
    [21, 46],
    [21, 26]
  ])
)

export const ICON_MAPPING = {
  marker: { x: 0, y: 0, width: 64, height: 64, mask: true }
}
