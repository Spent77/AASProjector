import { useStore } from '@/state/store'
import type { LayerId } from '@/types'

interface RowCfg {
  id: LayerId
  label: string
  icon: string
  maxTrail: number
  iconMin: number
  iconMax: number
  maxContactsMax: number
}

const ROWS: RowCfg[] = [
  { id: 'aircraft', label: 'Aircraft', icon: '✈', maxTrail: 500, iconMin: 8, iconMax: 48, maxContactsMax: 2000 },
  { id: 'ships', label: 'Ships', icon: '🚢', maxTrail: 500, iconMin: 8, iconMax: 48, maxContactsMax: 2000 },
  { id: 'satellites', label: 'Satellites', icon: '🛰', maxTrail: 120, iconMin: 1, iconMax: 12, maxContactsMax: 12000 }
]

function Slider({
  label,
  min,
  max,
  value,
  onChange
}: {
  label: string
  min: number
  max: number
  value: number
  onChange: (n: number) => void
}): JSX.Element {
  return (
    <div className="appear-slider">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="appear-val">{value}</span>
    </div>
  )
}

export default function AppearanceSettings(): JSX.Element {
  const s = useStore()

  return (
    <div className="appearance">
      {ROWS.map((r) => (
        <div key={r.id} className="appear-block">
          <div className="appear-head">
            <span className="appear-name">
              {r.icon} {r.label}
            </span>
            <input
              type="color"
              value={s.trailColors[r.id]}
              onChange={(e) => s.setTrailColor(r.id, e.target.value)}
              title={`${r.label} trail color`}
            />
          </div>

          <Slider label="Text" min={8} max={28} value={s.labelSizes[r.id]} onChange={(n) => s.setLabelSize(r.id, n)} />
          <Slider label="Icon" min={r.iconMin} max={r.iconMax} value={s.iconSizes[r.id]} onChange={(n) => s.setIconSize(r.id, n)} />
          <Slider label="Trail" min={2} max={r.maxTrail} value={s.trailLengths[r.id]} onChange={(n) => s.setTrailLength(r.id, n)} />
          <Slider label="Max" min={10} max={r.maxContactsMax} value={s.maxContacts[r.id]} onChange={(n) => s.setMaxContacts(r.id, n)} />
        </div>
      ))}
    </div>
  )
}
