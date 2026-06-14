import { ipcMain, type BrowserWindow } from 'electron'
import type { BBox, TleRecord } from '../shared/types'
import { AdsbPoller } from './dataSources/adsb'
import { AisClient } from './dataSources/ais'
import { fetchGroups, fetchFavorites } from './dataSources/tle'
import { FULL_CATALOG_GROUP, type SatelliteScopeMode } from '../shared/satellites'
import { getSettings, patchSettings, type PersistedSettings } from './store'

// Wires data-source lifecycles to a window's renderer. Each source pushes
// updates over a dedicated channel; the renderer configures region/enabled.
export function setupIpc(win: BrowserWindow): void {
  const send = (channel: string, payload: unknown): void => {
    if (!win.isDestroyed()) win.webContents.send(channel, payload)
  }

  const adsb = new AdsbPoller((aircraft) => send('adsb:update', aircraft))
  const ais = new AisClient(
    (ships) => send('ais:update', ships),
    (status, detail) => send('ais:status', { status, detail })
  )

  // Settings persistence.
  ipcMain.handle('settings:get', (): PersistedSettings => getSettings())
  ipcMain.handle(
    'settings:patch',
    (_e, patch: Partial<PersistedSettings>): PersistedSettings => patchSettings(patch)
  )

  ipcMain.handle(
    'adsb:configure',
    (_e, region: BBox, enabled: boolean) => {
      adsb.configure(region, enabled)
    }
  )

  ipcMain.handle(
    'ais:configure',
    (_e, region: BBox, key: string, enabled: boolean) => {
      ais.configure(region, key, enabled)
    }
  )

  // Satellites: renderer requests the TLE set for the current scope; main
  // fetches (cached) and returns records for client-side propagation.
  ipcMain.handle(
    'tle:fetch',
    async (
      _e,
      scope: SatelliteScopeMode,
      groups: string[],
      favorites: string[]
    ): Promise<TleRecord[]> => {
      if (scope === 'full') return fetchGroups([FULL_CATALOG_GROUP])
      if (scope === 'favorites') return fetchFavorites(favorites)
      return fetchGroups(groups)
    }
  )

  win.on('closed', () => {
    adsb.stop()
    ais.stop()
    ipcMain.removeHandler('settings:get')
    ipcMain.removeHandler('settings:patch')
    ipcMain.removeHandler('adsb:configure')
    ipcMain.removeHandler('ais:configure')
    ipcMain.removeHandler('tle:fetch')
  })
}
