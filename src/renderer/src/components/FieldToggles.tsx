import { useStore } from '@/state/store'
import type { FieldToggles as FT, LayerId } from '@/types'

type FieldMeta = { key: string; label: string }

const FIELD_META: Record<LayerId, FieldMeta[]> = {
  aircraft: [
    { key: 'callsign', label: 'Callsign' },
    { key: 'altitude', label: 'Altitude' },
    { key: 'groundSpeed', label: 'Speed' },
    { key: 'heading', label: 'Heading' },
    { key: 'verticalRate', label: 'V/S' },
    { key: 'squawk', label: 'Squawk' }
  ],
  ships: [
    { key: 'name', label: 'Name' },
    { key: 'speed', label: 'Speed' },
    { key: 'course', label: 'Course' },
    { key: 'shipType', label: 'Type' },
    { key: 'destination', label: 'Destination' }
  ],
  satellites: [
    { key: 'name', label: 'Name' },
    { key: 'altitude', label: 'Altitude' },
    { key: 'velocity', label: 'Velocity' },
    { key: 'group', label: 'Group' }
  ]
}

export default function FieldToggles({ layer }: { layer: LayerId }): JSX.Element {
  const fields = useStore((s) => s.fields[layer]) as Record<string, boolean>
  const toggleField = useStore((s) => s.toggleField)

  return (
    <div className="field-toggles">
      {FIELD_META[layer].map((f) => (
        <label key={f.key} className="chip">
          <input
            type="checkbox"
            checked={!!fields[f.key]}
            onChange={() =>
              toggleField(layer, f.key as keyof FT[typeof layer])
            }
          />
          <span>{f.label}</span>
        </label>
      ))}
    </div>
  )
}
