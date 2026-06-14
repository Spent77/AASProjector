import { useState } from 'react'
import { useStore } from '@/state/store'
import type { BBox } from '@/types'

const PRESETS: { label: string; box: BBox }[] = [
  { label: 'Continental US', box: { minLat: 24, minLon: -125, maxLat: 50, maxLon: -66 } },
  { label: 'Europe', box: { minLat: 35, minLon: -11, maxLat: 60, maxLon: 30 } },
  { label: 'East Asia', box: { minLat: 20, minLon: 100, maxLat: 46, maxLon: 146 } },
  { label: 'World', box: { minLat: -60, minLon: -179, maxLat: 75, maxLon: 179 } }
]

function Field({
  label,
  value,
  onChange
}: {
  label: string
  value: number
  onChange: (n: number) => void
}): JSX.Element {
  return (
    <label className="region-field">
      <span>{label}</span>
      <input
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </label>
  )
}

export default function RegionPicker(): JSX.Element {
  const region = useStore((s) => s.region)
  const setRegion = useStore((s) => s.setRegion)
  const viewBounds = useStore((s) => s.viewBounds)
  const [draft, setDraft] = useState<BBox>(region)

  const update = (patch: Partial<BBox>): void => setDraft({ ...draft, ...patch })

  const apply = (b: BBox): void => {
    setDraft(b)
    setRegion(b)
  }

  return (
    <div className="region-picker">
      <div className="preset-row">
        {PRESETS.map((p) => (
          <button key={p.label} onClick={() => apply(p.box)}>
            {p.label}
          </button>
        ))}
      </div>

      <button
        className="wide-btn"
        disabled={!viewBounds}
        onClick={() => viewBounds && apply(viewBounds)}
      >
        Use current map view
      </button>

      <div className="region-grid">
        <Field label="Min lat" value={draft.minLat} onChange={(n) => update({ minLat: n })} />
        <Field label="Max lat" value={draft.maxLat} onChange={(n) => update({ maxLat: n })} />
        <Field label="Min lon" value={draft.minLon} onChange={(n) => update({ minLon: n })} />
        <Field label="Max lon" value={draft.maxLon} onChange={(n) => update({ maxLon: n })} />
      </div>

      <button className="wide-btn primary" onClick={() => setRegion(draft)}>
        Apply region
      </button>
      <p className="scope-note">
        Drives which aircraft &amp; ships are fetched. Larger areas may be throttled by the feeds.
      </p>
    </div>
  )
}
