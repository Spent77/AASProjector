import { useEffect, useState } from 'react'
import { useStore } from '@/state/store'
import { inView } from '@/map/layers/satellitesLayer'

function ago(ts: number | null, now: number): string {
  if (!ts) return '—'
  const s = Math.max(0, Math.round((now - ts) / 1000))
  return s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`
}

const AIS_LABEL: Record<string, string> = {
  'no-key': 'no key',
  connecting: 'connecting…',
  open: 'connected',
  closed: 'off',
  error: 'error'
}

export default function StatusBar(): JSX.Element {
  const aircraft = useStore((s) => s.aircraft.length)
  const ships = useStore((s) => s.ships.length)
  const satellites = useStore((s) => s.satellites.length)
  const satsInView = useStore(
    (s) => s.satellites.filter((d) => inView(d.lat, d.lon, s.viewBounds, 0)).length
  )
  const lastAdsbAt = useStore((s) => s.lastAdsbAt)
  const lastAisAt = useStore((s) => s.lastAisAt)
  const aisStatus = useStore((s) => s.aisStatus)
  const shipsOn = useStore((s) => s.layers.ships)

  // Tick once a second so the "Ns ago" text stays current.
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const adsbFresh = lastAdsbAt != null && now - lastAdsbAt < 8000

  return (
    <div className="status-readout">
      <span className={adsbFresh ? 'live' : 'stale'}>
        ✈ {aircraft} <small>{ago(lastAdsbAt, now)}</small>
      </span>
      <span className="sep">·</span>
      <span>
        🚢 {ships}{' '}
        <small>
          {shipsOn ? AIS_LABEL[aisStatus.status] ?? aisStatus.status : 'off'}
          {aisStatus.status === 'open' && lastAisAt ? ` · ${ago(lastAisAt, now)}` : ''}
        </small>
      </span>
      <span className="sep">·</span>
      <span>
        🛰 {satellites} <small>{satsInView} in view</small>
      </span>
      {aisStatus.status === 'error' && aisStatus.detail && (
        <span className="status-error" title={aisStatus.detail}>
          ⚠ {aisStatus.detail.slice(0, 40)}
        </span>
      )}
    </div>
  )
}
