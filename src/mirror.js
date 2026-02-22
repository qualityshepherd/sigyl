import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { parseSeeds, seedToUrl } from './seeds.js'
import { crawlSeeds } from './crawler.js'
import { searchIdentities } from './search.js'
import { syncWithMirrors, seedsApiHandler } from './federation.js'
import { getStatus, matchesPattern, VOUCH } from './trust.js'
import { generateIndex } from './index.js'

const SEEDS_FILE = './seeds.txt'
const TRUST_FILE = './trust.json'
const INDEX_FILE = './public/index.html'
const BOOTSTRAP_MIRRORS = []

export async function loadSeeds () {
  try {
    const content = await fs.readFile(SEEDS_FILE, 'utf-8')
    return parseSeeds(content)
  } catch (err) {
    console.error('Failed to load seeds.txt:', err.message)
    return []
  }
}

export async function loadTrust () {
  try {
    const content = await fs.readFile(TRUST_FILE, 'utf-8')
    return JSON.parse(content)
  } catch {
    return {}
  }
}

export async function main () {
  const [seeds, trust] = await Promise.all([loadSeeds(), loadTrust()])

  const allSeeds = BOOTSTRAP_MIRRORS.length
    ? await syncWithMirrors(seeds, BOOTSTRAP_MIRRORS)
    : seeds

  const urls = allSeeds.map(seedToUrl)
  const identities = await crawlSeeds(urls)
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

  return { seeds: allSeeds, identities, vouched }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error)
}

export { seedsApiHandler }
