import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type { AdsbAircraft, AisShip, BBox, TleRecord } from '../shared/types'
import type { AisStatus } from '../shared/types'
import type { SatelliteScopeMode } from '../shared/satellites'
import type { PersistedSettings } from '../shared/settings'

// Safe, typed API surface exposed to the renderer.
const api = {
  toggleFullscreen: (): Promise<boolean> =>
    ipcRenderer.invoke('window:toggle-fullscreen'),

  adsb: {
    configure: (region: BBox, enabled: boolean): Promise<void> =>
      ipcRenderer.invoke('adsb:configure', region, enabled),
    onUpdate: (cb: (aircraft: AdsbAircraft[]) => void): (() => void) => {
      const listener = (_e: IpcRendererEvent, aircraft: AdsbAircraft[]): void =>
        cb(aircraft)
      ipcRenderer.on('adsb:update', listener)
      return () => ipcRenderer.removeListener('adsb:update', listener)
    }
  },

  ais: {
    configure: (region: BBox, key: string, enabled: boolean): Promise<void> =>
      ipcRenderer.invoke('ais:configure', region, key, enabled),
    onUpdate: (cb: (ships: AisShip[]) => void): (() => void) => {
      const listener = (_e: IpcRendererEvent, ships: AisShip[]): void => cb(ships)
      ipcRenderer.on('ais:update', listener)
      return () => ipcRenderer.removeListener('ais:update', listener)
    },
    onStatus: (
      cb: (e: { status: AisStatus; detail?: string }) => void
    ): (() => void) => {
      const listener = (
        _e: IpcRendererEvent,
        payload: { status: AisStatus; detail?: string }
      ): void => cb(payload)
      ipcRenderer.on('ais:status', listener)
      return () => ipcRenderer.removeListener('ais:status', listener)
    }
  },

  tle: {
    fetch: (
      scope: SatelliteScopeMode,
      groups: string[],
      favorites: string[]
    ): Promise<TleRecord[]> =>
      ipcRenderer.invoke('tle:fetch', scope, groups, favorites)
  },

  settings: {
    get: (): Promise<PersistedSettings> => ipcRenderer.invoke('settings:get'),
    patch: (patch: Partial<PersistedSettings>): Promise<PersistedSettings> =>
      ipcRenderer.invoke('settings:patch', patch)
  }
}

export type ProjectorApi = typeof api

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('projector', api)
} else {
  // @ts-ignore — fallback when contextIsolation is disabled
  window.projector = api
}
