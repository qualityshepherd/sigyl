import { validateSeedDomain } from './seeds.js'

async function defaultFetcher (url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchRemoteSeeds (mirrorUrl, fetcher = defaultFetcher) {
  try {
    const data = await fetcher(mirrorUrl)
    if (!data || !Array.isArray(data.seeds)) return []
    return data.seeds
  } catch (err) {
    console.error(`Failed to fetch seeds from ${mirrorUrl}:`, err.message)
    return []
  }
}

export function mergeSeedLists (local, remote) {
  const validRemote = remote.filter(validateSeedDomain)
  return [...new Set([...local, ...validRemote])]
}

export async function syncWithMirrors (localSeeds, mirrorUrls, fetcher = defaultFetcher) {
  let merged = [...localSeeds]

  for (const mirrorUrl of mirrorUrls) {
    const remoteSeeds = await fetchRemoteSeeds(mirrorUrl, fetcher)
    merged = mergeSeedLists(merged, remoteSeeds)
  }

  return merged
}

export function seedsApiHandler (seeds) {
  return (req, res) => {
    res.json({ mirror: req.hostname, version: '0.1', seeds })
  }
}
