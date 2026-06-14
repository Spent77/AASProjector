// Fetches TLE data from CelesTrak and caches it on disk. CelesTrak updates a
// few times per day, so we cache per-group for several hours to be a good
// citizen (their usage guidelines ask clients not to poll aggressively).

import { app } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import type { TleRecord } from '../../shared/types'

const CACHE_TTL_MS = 4 * 60 * 60 * 1000 // 4 hours
const USER_AGENT = 'Projector/0.1 (personal display app)'

function cacheDir(): string {
  return join(app.getPath('userData'), 'tle-cache')
}

function gpUrl(params: Record<string, string>): string {
  const q = new URLSearchParams({ ...params, FORMAT: 'tle' }).toString()
  return `https://celestrak.org/NORAD/elements/gp.php?${q}`
}

// Parse 3-line TLE text into records, tagging each with its group.
function parseTle(text: string, group: string): TleRecord[] {
  const lines = text.split(/\r?\n/).map((l) => l.trimEnd())
  const out: TleRecord[] = []
  for (let i = 0; i + 2 < lines.length + 1; i += 3) {
    const name = lines[i]?.trim()
    const l1 = lines[i + 1]
    const l2 = lines[i + 2]
    if (!name || !l1?.startsWith('1 ') || !l2?.startsWith('2 ')) continue
    const id = l1.slice(2, 7).trim()
    out.push({ id, name, group, line1: l1, line2: l2 })
  }
  return out
}

async function readCache(file: string): Promise<string | null> {
  try {
    const stat = await fs.stat(file)
    if (Date.now() - stat.mtimeMs > CACHE_TTL_MS) return null
    return await fs.readFile(file, 'utf8')
  } catch {
    return null
  }
}

async function writeCache(file: string, text: string): Promise<void> {
  try {
    await fs.mkdir(cacheDir(), { recursive: true })
    await fs.writeFile(file, text, 'utf8')
  } catch (err) {
    console.error('[tle] cache write failed:', (err as Error).message)
  }
}

async function fetchGroup(group: string): Promise<TleRecord[]> {
  const file = join(cacheDir(), `group-${group}.tle`)
  let text = await readCache(file)
  if (text === null) {
    const res = await fetch(gpUrl({ GROUP: group }), {
      headers: { 'User-Agent': USER_AGENT }
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    text = await res.text()
    if (text.includes('Invalid query') || text.trim().length === 0) {
      throw new Error(`empty/invalid response for group ${group}`)
    }
    await writeCache(file, text)
  }
  return parseTle(text, group)
}

async function fetchCatnr(id: string): Promise<TleRecord[]> {
  const file = join(cacheDir(), `catnr-${id}.tle`)
  let text = await readCache(file)
  if (text === null) {
    const res = await fetch(gpUrl({ CATNR: id }), {
      headers: { 'User-Agent': USER_AGENT }
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    text = await res.text()
    await writeCache(file, text)
  }
  return parseTle(text, 'favorites')
}

/** Fetch and merge TLEs for a set of groups, de-duplicated by NORAD id. */
export async function fetchGroups(groups: string[]): Promise<TleRecord[]> {
  const byId = new Map<string, TleRecord>()
  await Promise.all(
    groups.map(async (g) => {
      try {
        for (const rec of await fetchGroup(g)) byId.set(rec.id, rec)
      } catch (err) {
        console.error(`[tle] group ${g} failed:`, (err as Error).message)
      }
    })
  )
  return [...byId.values()]
}

/** Fetch TLEs for specific NORAD ids (favorites). */
export async function fetchFavorites(ids: string[]): Promise<TleRecord[]> {
  const byId = new Map<string, TleRecord>()
  await Promise.all(
    ids.map(async (id) => {
      try {
        for (const rec of await fetchCatnr(id)) byId.set(rec.id, rec)
      } catch (err) {
        console.error(`[tle] catnr ${id} failed:`, (err as Error).message)
      }
    })
  )
  return [...byId.values()]
}
