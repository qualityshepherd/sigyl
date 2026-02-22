export function validateSeedDomain (domain) {
  if (!domain || typeof domain !== 'string') return false
  if (domain.includes('/') || domain.includes(':')) return false
  if (!domain.includes('.')) return false

  try {
    const parsed = new URL(`https://${domain}`)
    return parsed.hostname === domain
  } catch {
    return false
  }
}

export function parseSeeds (content) {
  if (!content) return []

  const domains = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .filter(validateSeedDomain)

  return [...new Set(domains)]
}

export function seedToUrl (domain) {
  return `https://${domain}/identity.json`
}
