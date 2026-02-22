export const VOUCH = 'vouch'
export const BLOCK = 'block'
export const STRANGER = 'stranger'

const VALID_STATES = new Set([VOUCH, BLOCK, STRANGER])

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

export function validateTrust (trust) {
  if (!trust || typeof trust !== 'object' || Array.isArray(trust)) {
    throw new Error('trust.json must be a JSON object')
  }

  for (const [key, val] of Object.entries(trust)) {
    if (key === 'block_patterns') {
      if (!Array.isArray(val)) {
        throw new Error('block_patterns must be an array')
      }
      for (const pattern of val) {
        if (typeof pattern !== 'string') {
          throw new Error(`block_patterns entries must be strings, got: ${typeof pattern}`)
        }
      }
      continue
    }

    if (!VALID_STATES.has(val)) {
      throw new Error(`invalid trust state for "${key}": "${val}" — must be vouch, block, or stranger`)
    }
  }

  return true
}
