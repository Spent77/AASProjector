import { useStore } from '@/state/store'
import { CURATED_GROUPS } from '@shared/satellites'
import type { SatelliteScopeMode } from '@/types'

const MODES: { id: SatelliteScopeMode; label: string }[] = [
  { id: 'curated', label: 'Curated' },
  { id: 'full', label: 'Full catalog' },
  { id: 'favorites', label: 'Favorites' }
]

export default function SatelliteScope(): JSX.Element {
  const scope = useStore((s) => s.satScope)
  const setScope = useStore((s) => s.setSatScope)
  const groups = useStore((s) => s.satGroups)
  const setGroups = useStore((s) => s.setSatGroups)

  const toggleGroup = (key: string): void => {
    setGroups(
      groups.includes(key) ? groups.filter((g) => g !== key) : [...groups, key]
    )
  }

  return (
    <div className="sat-scope">
      <div className="seg">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={m.id === scope ? 'active' : ''}
            onClick={() => setScope(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {scope === 'curated' && (
        <div className="group-grid">
          {CURATED_GROUPS.map((g) => (
            <label key={g.key} className="group-item">
              <input
                type="checkbox"
                checked={groups.includes(g.key)}
                onChange={() => toggleGroup(g.key)}
              />
              <span>{g.label}</span>
            </label>
          ))}
        </div>
      )}

      {scope === 'full' && (
        <p className="scope-note">~10k objects — icons only, labels hidden for clarity.</p>
      )}
      {scope === 'favorites' && (
        <p className="scope-note">Tracking {useStore.getState().satFavorites.length} favorite(s) by NORAD id.</p>
      )}
    </div>
  )
}
