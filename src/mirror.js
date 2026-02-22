import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { crawlSeeds } from './crawler.js'
import { searchIdentities } from './search.js'
import { getStatus, matchesPattern, VOUCH, STRANGER } from './trust.js'
import { generateIndex } from './index.js'

const TRUST_FILE = './trust.json'
const INDEX_FILE = './public/index.html'
const LOG_FILE = './public/crawl.json'

export async function loadTrust () {
  try {
    const content = await fs.readFile(TRUST_FILE, 'utf-8')
    return JSON.parse(content)
  } catch {
    return {}
  }
}

export async function main () {
  const crawledAt = new Date().toISOString()
  const trust = await loadTrust()

  const domains = Object.entries(trust)
    .filter(([key, val]) => !key.startsWith('block_patterns') && (val === VOUCH || val === STRANGER))
    .map(([domain]) => domain)

  const urls = domains.map(d => `https://${d}/identity.json`)
  const identities = await crawlSeeds(urls)

  // Build crawl log
  const results = domains.map(domain => {
    const found = identities.filter(i => i.domain === domain)
    return {
      domain,
      status: found.length ? 'ok' : 'failed',
      identities: found.length,
      trust: getStatus(trust, domain)
    }
  })

  const vouched = identities.filter(i =>
    getStatus(trust, i.domain) === VOUCH && !matchesPattern(trust, i.domain)
  )

  const mirrorDomain = process.env.MIRROR_DOMAIN || 'localhost'
  const html = generateIndex(vouched, mirrorDomain)

  const log = {
    crawled_at: crawledAt,
    mirror: mirrorDomain,
    vouched: vouched.length,
    results
  }

  await Promise.all([
    fs.writeFile(INDEX_FILE, html, 'utf-8'),
    fs.writeFile(LOG_FILE, JSON.stringify(log, null, 2), 'utf-8')
  ])

  console.log(`crawled ${domains.length} domains, ${vouched.length} vouched`)

  const query = process.argv[2]
  if (query) {
    const results = searchIdentities(vouched, query)
    results.forEach(i => console.log(`${i.domain} - ${i.public_key}`))
  }

  return { identities, vouched, log }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error)
}
