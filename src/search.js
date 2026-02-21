export function normalizeIdentity (identity, domain) {
  return { ...identity, domain }
}

export function searchIdentities (identities, query) {
  if (!query) return identities

  const terms = query.toLowerCase().split(' ').filter(Boolean)

  return identities.filter(identity => {
    const searchable = [identity.domain].join(' ').toLowerCase()
    return terms.every(term => searchable.includes(term))
  })
}
