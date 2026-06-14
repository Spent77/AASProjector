# Projector — Live Air / Sea / Space Map

A cross-platform (Windows + macOS) desktop app that displays live public tracking
data on a map, designed for an always-on projector / wall display.

- **✈ Aircraft** — ADS-B via [airplanes.live](https://airplanes.live)
- **🚢 Ships** — AIS via [AISStream.io](https://aisstream.io) (needs a free API key)
- **🛰 Satellites** — TLE from [CelesTrak](https://celestrak.org), propagated with SGP4

Multiple basemaps, a toggle per data layer, and per-track label fields (callsign,
altitude, speed, heading, etc.) that you can switch on and off independently.

## Quick start (development)

```bash
npm install
npm run dev          # launches the Electron app with hot reload
```

The app opens windowed. Press **F11** (or the in-app button) to toggle fullscreen
for projector use.

> **Moving the project between machines** (e.g. via OneDrive or a copy): delete
> `node_modules` and reinstall — it holds platform-specific binaries (Electron itself).
> ```bash
> rm -rf node_modules && npm install
> ```

## Configure

Open the control panel (top-right) → **API keys**:

- **AISStream.io** — paste a free key (no card required) to enable ship tracking.
- **MapTiler** — optional, unlocks premium vector basemaps.

Keys are stored locally via `electron-store` in your OS user-data directory and
are never bundled or transmitted anywhere except the service they belong to.

Set your **Region** (control panel → Region) to the area you want aircraft and
ships fetched for. Use a preset, type a bounding box, or pan/zoom the map and
click **Use current map view**. Satellites are global; choose **Curated**,
**Full catalog**, or **Favorites** in the Satellites layer section.

## Build installers

```bash
npm run dist:win     # Windows NSIS installer (.exe)  -> dist/
npm run dist:mac     # macOS disk image (.dmg, build on a Mac)
```

> Cross-building a macOS `.dmg` must be done on macOS. Build the Windows
> installer on Windows.

The installer lands in `dist/` (e.g. `Projector-0.1.0.dmg`, `-arm64.dmg` on Apple
Silicon). Because the app isn't code-signed, the first macOS launch shows a Gatekeeper
warning (*"…cannot check it for malicious software"*) — right-click the app → **Open** →
**Open**, or run `xattr -cr /Applications/Projector.app`.

For a quick local build without the installer wrapper:

```bash
npm run build                 # compile main/preload/renderer
npx electron-builder --dir    # unpacked app in dist/<platform>-unpacked
```

## Architecture

| Process   | Responsibility |
|-----------|----------------|
| **main**  | All network + persistence: ADS-B polling, AIS WebSocket, CelesTrak fetch/cache, settings (`src/main/`) |
| **preload** | Typed `contextBridge` API surface (`src/preload/`) |
| **renderer** | UI + rendering: MapLibre GL basemaps, deck.gl GPU layers, satellite propagation web worker, zustand state (`src/renderer/`) |
| **shared** | IPC wire types + settings schema (`src/shared/`) |

Smooth motion comes from **dead-reckoning**: a `requestAnimationFrame` loop advances each
aircraft/ship along its reported speed and heading every frame, and each new feed update
(aircraft ~2 s, AIS as received) resets the position to truth. Satellites are propagated in
a web worker. Trails are accumulated per track and drawn with a `PathLayer`.

> **Note:** Electron's main process runs Node 20, which has **no global `WebSocket`** — the
> AIS client uses the [`ws`](https://www.npmjs.com/package/ws) package. `fetch` *is* global
> in the main process (used for ADS-B/TLE).

## Data source notes

- **ADS-B** is rate-limited (~1 req/sec); the app runs a single region-scoped
  polling loop. Very large regions are capped at a 250 nmi radius per request.
- **CelesTrak** TLE responses are cached on disk for 4 hours to respect their
  usage guidelines.
- The **full** satellite catalog is ~10k objects; labels are hidden in that mode
  for clarity and the work runs in a web worker to keep the UI smooth.
