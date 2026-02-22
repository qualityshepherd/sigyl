import { normalizeIdentity } from './search.js'

const REQUIRED_FIELDS = ['public_key', 'mirror']

function validateIdentity (identity) {
  return REQUIRED_FIELDS.every(field => identity[field] !== undefined)
}

export function validateFeed (feed) {
  if (!feed) return false
  if (!Array.isArray(feed.identities) || feed.identities.length === 0) return false
  return feed.identities.every(validateIdentity)
}

async function fetchFeed (url) {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error(`Failed to fetch ${url}:`, err.message)
    return null
  }
}

export function normalizeIdentities (feed, sourceUrl) {
  const domain = new URL(sourceUrl).hostname
  return feed.identities.map(identity => normalizeIdentity(identity, domain))
}

export async function crawlSeeds (seeds, fetcher = fetchFeed) {
  const all = []

  for (const url of seeds) {
    const feed = await fetcher(url)
    if (!validateFeed(feed)) continue
    all.push(...normalizeIdentities(feed, url))
  }

  return all
}
