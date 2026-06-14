import { useEffect } from 'react'
import MapView from './map/MapView'
import ControlPanel from './components/ControlPanel'
import StatusBar from './components/StatusBar'
import { useFeeds } from './state/useFeeds'
import { useSettingsSync } from './state/useSettingsSync'

export default function App(): JSX.Element {
  useSettingsSync()
  useFeeds()

  // F11 toggles fullscreen for projector use.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault()
        window.projector.toggleFullscreen()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="app-shell">
      <MapView />
      <ControlPanel />
      <StatusBar />
    </div>
  )
}
