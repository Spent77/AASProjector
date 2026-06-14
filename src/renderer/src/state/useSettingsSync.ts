import { useEffect, useRef } from 'react'
import { useStore, type AppState } from './store'
import type { FieldToggles, SatelliteScopeMode } from '@/types'

// The configuration subset that is persisted (excludes live track data).
function configSnapshot(s: AppState): Record<string, unknown> {
  return {
    basemap: s.basemap,
    maptilerKey: s.maptilerKey ?? '',
    aisKey: s.aisKey,
    region: s.region,
    showLabels: s.showLabels,
    showTracks: s.showTracks,
    showPlaceLabels: s.showPlaceLabels,
    airborneLabelsOnly: s.airborneLabelsOnly,
    labelSizes: s.labelSizes,
    iconSizes: s.iconSizes,
    maxContacts: s.maxContacts,
    trailLengths: s.trailLengths,
    trailColors: s.trailColors,
    layers: s.layers,
    satScope: s.satScope,
    satGroups: s.satGroups,
    satFavorites: s.satFavorites,
    fields: s.fields
  }
}

function looksLikeFields(v: unknown): v is FieldToggles {
  return (
    !!v &&
    typeof v === 'object' &&
    'aircraft' in (v as object) &&
    'ships' in (v as object) &&
    'satellites' in (v as object)
  )
}

/** Loads persisted settings on mount and writes config changes back (debounced). */
export function useSettingsSync(): void {
  const hydrate = useStore((s) => s.hydrate)
  const lastSerialized = useRef<string>('')

  // Load once.
  useEffect(() => {
    let mounted = true
    void window.projector.settings.get().then((s) => {
      if (!mounted) return
      hydrate({
        basemap: s.basemap,
        maptilerKey: s.maptilerKey || null,
        aisKey: s.aisKey,
        region: s.region,
        showLabels: s.showLabels,
        showTracks: s.showTracks,
        ...(typeof s.showPlaceLabels === 'boolean' ? { showPlaceLabels: s.showPlaceLabels } : {}),
        ...(typeof s.airborneLabelsOnly === 'boolean'
          ? { airborneLabelsOnly: s.airborneLabelsOnly }
          : {}),
        ...(s.labelSizes ? { labelSizes: s.labelSizes } : {}),
        ...(s.iconSizes ? { iconSizes: s.iconSizes } : {}),
        ...(s.maxContacts ? { maxContacts: s.maxContacts } : {}),
        ...(s.trailLengths ? { trailLengths: s.trailLengths } : {}),
        ...(s.trailColors ? { trailColors: s.trailColors } : {}),
        layers: s.layers,
        satScope: s.satScope as SatelliteScopeMode,
        satGroups: s.satGroups,
        satFavorites: s.satFavorites,
        ...(looksLikeFields(s.fields) ? { fields: s.fields } : {})
      })
      lastSerialized.current = JSON.stringify(configSnapshot(useStore.getState()))
    })
    return () => {
      mounted = false
    }
  }, [hydrate])

  // Persist when the config subset changes. The listener fires on every track
  // update too, so we diff a cheap serialized snapshot and skip no-ops.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const unsub = useStore.subscribe((state) => {
      const serialized = JSON.stringify(configSnapshot(state))
      if (serialized === lastSerialized.current) return
      lastSerialized.current = serialized
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        void window.projector.settings.patch(JSON.parse(serialized))
      }, 400)
    })
    return () => {
      if (timer) clearTimeout(timer)
      unsub()
    }
  }, [])
}
