export function validateSeedUrl (url) {
  if (!url || typeof url !== 'string') return false

  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && url.endsWith('/identity.json')
  } catch {
    return false
  }
}

export function parseSeeds (content) {
  if (!content) return []

  const urls = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .filter(validateSeedUrl)

  return [...new Set(urls)]
}
