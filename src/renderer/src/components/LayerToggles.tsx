import { useStore } from '@/state/store'
import FieldToggles from './FieldToggles'
import SatelliteScope from './SatelliteScope'
import type { LayerId } from '@/types'

const LAYERS: { id: LayerId; label: string; icon: string }[] = [
  { id: 'aircraft', label: 'Aircraft', icon: '✈' },
  { id: 'ships', label: 'Ships', icon: '🚢' },
  { id: 'satellites', label: 'Satellites', icon: '🛰' }
]

export default function LayerToggles(): JSX.Element {
  const layers = useStore((s) => s.layers)
  const setLayer = useStore((s) => s.setLayer)
  const counts = useStore((s) => ({
    aircraft: s.aircraft.length,
    ships: s.ships.length,
    satellites: s.satellites.length
  }))

  return (
    <div className="layer-toggles">
      {LAYERS.map((l) => (
        <div key={l.id} className="layer-block">
          <label className="layer-head">
            <input
              type="checkbox"
              checked={layers[l.id]}
              onChange={(e) => setLayer(l.id, e.target.checked)}
            />
            <span className="layer-title">
              {l.icon} {l.label}
            </span>
            <span className="layer-count">{counts[l.id]}</span>
          </label>

          {layers[l.id] && (
            <div className="layer-body">
              {l.id === 'satellites' && <SatelliteScope />}
              <FieldToggles layer={l.id} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
