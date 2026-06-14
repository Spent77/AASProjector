// Persistent settings (API keys, region, layer/field defaults) stored locally
// in the OS userData dir via electron-store. Keys never leave this machine.

import Store from 'electron-store'
import { DEFAULT_SETTINGS, type PersistedSettings } from '../shared/settings'

export type { PersistedSettings }

const store = new Store<PersistedSettings>({
  defaults: DEFAULT_SETTINGS,
  name: 'projector-settings'
})

export function getSettings(): PersistedSettings {
  return store.store
}

export function patchSettings(patch: Partial<PersistedSettings>): PersistedSettings {
  store.set({ ...store.store, ...patch })
  return store.store
}

export function getAisKey(): string {
  return store.get('aisKey')
}
