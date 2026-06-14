import { useState } from 'react'
import { useStore } from '@/state/store'

export default function SettingsModal({ onClose }: { onClose: () => void }): JSX.Element {
  const aisKey = useStore((s) => s.aisKey)
  const maptilerKey = useStore((s) => s.maptilerKey)
  const setAisKey = useStore((s) => s.setAisKey)
  const setMaptilerKey = useStore((s) => s.setMaptilerKey)

  const [ais, setAis] = useState(aisKey)
  const [mt, setMt] = useState(maptilerKey ?? '')

  const save = (): void => {
    setAisKey(ais.trim())
    setMaptilerKey(mt.trim() || null)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>API Keys</h2>
        <p className="scope-note">
          Keys are stored locally on this machine only. They are never bundled or sent anywhere
          except the service they belong to.
        </p>

        <label className="modal-field">
          <span>AISStream.io key (ships)</span>
          <input
            type="password"
            value={ais}
            placeholder="Paste your free AISStream key"
            onChange={(e) => setAis(e.target.value)}
          />
          <a href="https://aisstream.io" target="_blank" rel="noreferrer">
            Get a free key →
          </a>
        </label>

        <label className="modal-field">
          <span>MapTiler key (optional premium basemaps)</span>
          <input
            type="password"
            value={mt}
            placeholder="Optional"
            onChange={(e) => setMt(e.target.value)}
          />
        </label>

        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={save}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
