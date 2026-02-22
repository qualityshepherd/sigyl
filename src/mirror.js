import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { crawlSeeds } from './crawler.js'
import { searchIdentities } from './search.js'
import { getStatus, matchesPattern, VOUCH, STRANGER } from './trust.js'
import { generateIndex } from './index.js'

const TRUST_FILE = './trust.json'
const INDEX_FILE = './public/index.html'

export async function loadTrust () {
  try {
    const content = await fs.readFile(TRUST_FILE, 'utf-8')
    return JSON.parse(content)
  } catch {
    return {}
  }
}

export async function main () {
  const trust = await loadTrust()

  // Crawl vouched and stranger domains — block and unknown are ignored
  const domains = Object.entries(trust)
    .filter(([key, val]) => !key.startsWith('block_patterns') && (val === VOUCH || val === STRANGER))
    .map(([domain]) => `https://${domain}/identity.json`)

  const identities = await crawlSeeds(domains)

  // Only show vouched on the mirror — strangers are watched but not shown
  const vouched = identities.filter(i =>
    getStatus(trust, i.domain) === VOUCH && !matchesPattern(trust, i.domain)
  )

  const mirrorDomain = process.env.MIRROR_DOMAIN || 'localhost'
  const html = generateIndex(vouched, mirrorDomain)
  await fs.writeFile(INDEX_FILE, html, 'utf-8')

  const query = process.argv[2]
  if (query) {
    const results = searchIdentities(vouched, query)
    results.forEach(i => console.log(`${i.domain} - ${i.public_key}`))
  }

  return { identities, vouched }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error)
}
