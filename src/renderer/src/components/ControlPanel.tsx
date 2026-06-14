import { useState } from 'react'
import { useStore } from '@/state/store'
import { BASEMAPS } from '@/map/basemaps'
import LayerToggles from './LayerToggles'
import RegionPicker from './RegionPicker'
import SettingsModal from './SettingsModal'
import AppearanceSettings from './AppearanceSettings'

export default function ControlPanel(): JSX.Element {
  const [collapsed, setCollapsed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const basemap = useStore((s) => s.basemap)
  const setBasemap = useStore((s) => s.setBasemap)
  const showLabels = useStore((s) => s.showLabels)
  const setShowLabels = useStore((s) => s.setShowLabels)
  const showTracks = useStore((s) => s.showTracks)
  const setShowTracks = useStore((s) => s.setShowTracks)
  const showPlaceLabels = useStore((s) => s.showPlaceLabels)
  const setShowPlaceLabels = useStore((s) => s.setShowPlaceLabels)
  const airborneLabelsOnly = useStore((s) => s.airborneLabelsOnly)
  const setAirborneLabelsOnly = useStore((s) => s.setAirborneLabelsOnly)
  const hoverTooltips = useStore((s) => s.hoverTooltips)
  const setHoverTooltips = useStore((s) => s.setHoverTooltips)

  if (collapsed) {
    return (
      <button className="panel-fab" onClick={() => setCollapsed(false)} title="Show controls">
        ☰
      </button>
    )
  }

  return (
    <div className="control-panel">
      <div className="panel-header">
        <span className="panel-title">Projector</span>
        <button className="icon-btn" onClick={() => setCollapsed(true)} title="Hide">
          ✕
        </button>
      </div>

      <details open className="section">
        <summary>Display</summary>
        <div className="basemap-grid">
          {BASEMAPS.map((b) => (
            <button
              key={b.id}
              className={b.id === basemap ? 'active' : ''}
              onClick={() => setBasemap(b.id)}
            >
              {b.label}
            </button>
          ))}
        </div>
        <label className="chip wide">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
          />
          <span>Show track labels</span>
        </label>
        <label className="chip wide">
          <input
            type="checkbox"
            checked={airborneLabelsOnly}
            onChange={(e) => setAirborneLabelsOnly(e.target.checked)}
          />
          <span>Aircraft labels: airborne only</span>
        </label>
        <label className="chip wide">
          <input
            type="checkbox"
            checked={hoverTooltips}
            onChange={(e) => setHoverTooltips(e.target.checked)}
          />
          <span>Hover for details</span>
        </label>
        <label className="chip wide">
          <input
            type="checkbox"
            checked={showTracks}
            onChange={(e) => setShowTracks(e.target.checked)}
          />
          <span>Show tracks (trails)</span>
        </label>
        <label className="chip wide">
          <input
            type="checkbox"
            checked={showPlaceLabels}
            onChange={(e) => setShowPlaceLabels(e.target.checked)}
          />
          <span>Map place names</span>
        </label>
        <button className="wide-btn" onClick={() => window.projector.toggleFullscreen()}>
          Toggle fullscreen (F11)
        </button>
      </details>

      <details open className="section">
        <summary>Layers &amp; labels</summary>
        <LayerToggles />
      </details>

      <details className="section">
        <summary>Appearance (text &amp; trails)</summary>
        <AppearanceSettings />
      </details>

      <details className="section">
        <summary>Region</summary>
        <RegionPicker />
      </details>

      <button className="wide-btn" onClick={() => setSettingsOpen(true)}>
        ⚙ API keys
      </button>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
