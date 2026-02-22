export const VOUCH = 'vouch'
export const BLOCK = 'block'
export const STRANGER = 'stranger'

export function createTrustList () {
  return {}
}

export function vouch (list, domain) {
  return { ...list, [domain]: VOUCH }
}

export function block (list, domain) {
  return { ...list, [domain]: BLOCK }
}

export function getStatus (list, domain) {
  return list[domain] || STRANGER
}

export function matchesPattern (list, domain) {
  const patterns = list.block_patterns || []
  return patterns.some(pattern => {
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(2)
      return domain.endsWith('.' + suffix)
    }
    return domain === pattern
  })
}
