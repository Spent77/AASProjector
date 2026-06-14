// Extrapolates a track's current position from its last report using speed and
// heading. This drives smooth, real-speed motion between feed updates; each new
// report resets the base, so positions stay accurate (and stop drifting if the
// feed stalls, thanks to the extrapolation cap).

const MAX_EXTRAPOLATE_MS = 30_000

export function deadReckon(
  lat: number,
  lon: number,
  speedKnots: number | null | undefined,
  headingDeg: number | null | undefined,
  updatedMs: number,
  now: number
): [number, number] {
  if (speedKnots == null || headingDeg == null || speedKnots <= 0) {
    return [lon, lat]
  }
  const elapsed = Math.min(Math.max(now - updatedMs, 0), MAX_EXTRAPOLATE_MS)
  const distNm = speedKnots * (elapsed / 3_600_000)
  const h = (headingDeg * Math.PI) / 180
  const dLat = (distNm * Math.cos(h)) / 60
  const cosLat = Math.cos((lat * Math.PI) / 180) || 1e-6
  const dLon = (distNm * Math.sin(h)) / (60 * cosLat)
  return [lon + dLon, lat + dLat]
}
