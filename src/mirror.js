import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { crawlSeeds } from './crawler.js'
import { searchIdentities } from './search.js'
import { getStatus, matchesPattern, validateTrust, VOUCH, STRANGER } from './trust.js'
import { generateIndex } from './index.js'

const TRUST_FILE = './trust.json'
const INDEX_FILE = './public/index.html'
const LOG_FILE = './public/crawl.json'

export async function loadTrust () {
  try {
    const content = await fs.readFile(TRUST_FILE, 'utf-8')
    const trust = JSON.parse(content)
    validateTrust(trust)
    return trust
  } catch (err) {
    throw new Error(`trust.json invalid: ${err.message}`)
  }
}

export async function saveTrust (trust) {
  validateTrust(trust)
  const content = JSON.stringify(trust, null, 2)
  await fs.writeFile(TRUST_FILE, content, 'utf-8')
  // Read back and verify
  const readBack = JSON.parse(await fs.readFile(TRUST_FILE, 'utf-8'))
  validateTrust(readBack)
}

export function discoverStrangers (identities, trust) {
  const discovered = {}

  for (const identity of identities) {
    const domain = identity.domain
    if (!trust[domain] && !matchesPattern(trust, domain)) {
      discovered[domain] = STRANGER
    }
  }

  return discovered
}

export async function main () {
  const crawledAt = new Date().toISOString()
  let trust = await loadTrust()

  const domains = Object.entries(trust)
    .filter(([key, val]) => key !== 'block_patterns' && val === VOUCH)
    .map(([domain]) => domain)

  const urls = domains.map(d => `https://${d}/identity.json`)
  const identities = await crawlSeeds(urls)

  const discovered = discoverStrangers(identities, trust)
  const newStrangers = Object.keys(discovered)

  if (newStrangers.length) {
    trust = { ...trust, ...discovered }
    await saveTrust(trust)
    console.log(`discovered ${newStrangers.length} new stranger(s): ${newStrangers.join(', ')}`)
  }

  const vouched = identities.filter(i =>
    getStatus(trust, i.domain) === VOUCH && !matchesPattern(trust, i.domain)
  )

  const mirrorDomain = process.env.MIRROR_DOMAIN || 'localhost'
  const html = generateIndex(vouched, mirrorDomain)

  const results = domains.map(domain => {
    const found = identities.filter(i => i.domain === domain)
    return {
      domain,
      status: found.length ? 'ok' : 'failed',
      identities: found.length,
      trust: getStatus(trust, domain)
    }
  })

  const log = {
    crawled_at: crawledAt,
    mirror: mirrorDomain,
    vouched: vouched.length,
    discovered: newStrangers,
    results
  }

  await Promise.all([
    fs.writeFile(INDEX_FILE, html, 'utf-8'),
    fs.writeFile(LOG_FILE, JSON.stringify(log, null, 2), 'utf-8')
  ])

  console.log(`crawled ${domains.length} domains, ${vouched.length} vouched, ${newStrangers.length} discovered`)

  const query = process.argv[2]
  if (query) {
    const found = searchIdentities(vouched, query)
    found.forEach(i => console.log(`${i.domain} - ${i.public_key}`))
  }

  return { identities, vouched, discovered, log }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error)
}
