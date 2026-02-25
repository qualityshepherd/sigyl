import { generateIndex, generateAdmin } from './generate.js'

export { generateIndex, generateAdmin }

const VOUCH = 'vouch'
const STRANGER = 'stranger'
const BLOCK = 'block'
const FETCH_TIMEOUT_MS = 5000
const FETCH_MAX_BYTES = 64 * 1024

export function getTrustState (trust, domain) {
  const entry = trust[domain]
  if (!entry) return STRANGER
  return typeof entry === 'object' ? entry.trust : entry
}

export function isMirror (trust, domain) {
  const entry = trust[domain]
  return typeof entry === 'object' && entry.mirror === true
}

export function isBlocked (trust, domain) {
  if (getTrustState(trust, domain) === BLOCK) return true
  const patterns = trust.block_patterns || []
  return patterns.some(p => p.startsWith('*.') ? domain.endsWith(p.slice(1)) : domain === p)
}

export async function safeFetch (url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return { error: `http ${res.status}` }

    const reader = res.body.getReader()
    const chunks = []
    let totalLength = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (totalLength + value.length > FETCH_MAX_BYTES) {
        reader.cancel()
        return { error: 'too large' }
      }
      chunks.push(value)
      totalLength += value.length
    }

    const combined = new Uint8Array(totalLength)
    let pos = 0
    for (const chunk of chunks) {
      combined.set(chunk, pos)
      pos += chunk.length
    }

    return { text: new TextDecoder().decode(combined) }
  } catch (err) {
    return { error: err.name === 'AbortError' ? 'timeout' : err.message }
  } finally {
    clearTimeout(timer)
  }
}

export async function crawl (trust, mirrorDomain) {
  const identities = []
  const errors = []
  const strangers = []
  const domains = Object.keys(trust).filter(k => k !== 'block_patterns')

  for (const domain of domains) {
    // Don't crawl yourself or blocked domains
    if (domain === mirrorDomain || isBlocked(trust, domain)) continue

    const state = getTrustState(trust, domain)

    if (isMirror(trust, domain)) {
      const { text, error } = await safeFetch(`https://${domain}/trust.json`)
      if (error) {
        errors.push({ domain, status: error })
        continue
      }
      try {
        const remoteTrust = JSON.parse(text)
        Object.keys(remoteTrust).forEach(remote => {
          if (remote !== 'block_patterns' && !trust[remote] && remote !== mirrorDomain) {
            strangers.push(remote)
          }
        })
        identities.push({ domain, trust: state, mirror: true })
      } catch {
        errors.push({ domain, status: 'invalid json' })
      }
      continue
    }

    if (state === STRANGER) {
      identities.push({ domain, trust: STRANGER })
      continue
    }

    const { text, error } = await safeFetch(`https://${domain}/sigyl.json`)
    if (error) {
      errors.push({ domain, status: error })
      continue
    }
    try {
      const sigyl = JSON.parse(text)
      if (!sigyl.public_key) throw new Error()
      identities.push({ domain, trust: state })
    } catch {
      errors.push({ domain, status: 'invalid sigyl.json' })
    }
  }
  return { identities, errors, strangers }
}

export async function runCrawl (env) {
  const kv = env.SIGYL_KV
  const trust = await loadTrust(kv)
  const { identities, errors, strangers } = await crawl(trust, env.MIRROR_DOMAIN)

  let trustChanged = false
  for (const domain of strangers) {
    if (!trust[domain]) {
      trust[domain] = STRANGER
      trustChanged = true
    }
  }

  if (trustChanged) await saveTrust(kv, trust)

  const crawlData = { crawled_at: new Date().toISOString(), identities, errors }
  await kv.put('crawl.json', JSON.stringify(crawlData))
  await kv.put('index.html', generateIndex(identities, env.MIRROR_DOMAIN, crawlData.crawled_at))

  if (trustChanged && env.ADMIN_EMAIL) {
    const newStrangers = strangers.filter(s => trust[s] === STRANGER)
    await notify(env, newStrangers)
  }
  return crawlData
}

async function loadTrust (kv) {
  const raw = await kv.get('trust.json')
  return raw ? JSON.parse(raw) : { block_patterns: [] }
}

async function saveTrust (kv, trust) {
  await kv.put('trust.json', JSON.stringify(trust))
}

async function notify (env, newStrangers) {
  const body = `${newStrangers.length} new strangers waiting:\n\n${newStrangers.join('\n')}\n\nhttps://${env.MIRROR_DOMAIN}/admin`
  await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: env.ADMIN_EMAIL }] }],
      from: { email: `sigyl@${env.MIRROR_DOMAIN}` },
      subject: `sigyl: ${newStrangers.length} new stranger(s)`,
      content: [{ type: 'text/plain', value: body }]
    })
  })
}

async function handleRequest (request, env) {
  const url = new URL(request.url)
  const kv = env.SIGYL_KV
  const token = env.ADMIN_TOKEN

  // NEW: Manual crawl trigger for production
  if (url.pathname === '/admin/crawl') {
    if (url.searchParams.get('token') !== token) return new Response('unauthorized', { status: 401 })
    const result = await runCrawl(env)
    return new Response(JSON.stringify(result, null, 2), { headers: { 'content-type': 'application/json' } })
  }

  if (url.pathname === '/admin/trust') {
    if (url.searchParams.get('token') !== token) return new Response('unauthorized', { status: 401 })
    const domain = url.searchParams.get('domain')
    const state = url.searchParams.get('state')

    const trust = await loadTrust(kv)
    if (state === 'mirror') {
      trust[domain] = { trust: VOUCH, mirror: true }
    } else if ([VOUCH, BLOCK, STRANGER].includes(state)) {
      trust[domain] = state
    }

    await saveTrust(kv, trust)
    return Response.redirect(`${url.origin}/admin?token=${token}`, 302)
  }

  if (url.pathname === '/admin') {
    if (url.searchParams.get('token') !== token) return new Response('unauthorized', { status: 401 })
    const trust = await loadTrust(kv)
    return new Response(generateAdmin(trust, env.MIRROR_DOMAIN, token), {
      headers: { 'content-type': 'text/html;charset=utf-8' }
    })
  }

  if (url.pathname === '/') {
    const html = await kv.get('index.html') || generateIndex([], env.MIRROR_DOMAIN, null)
    return new Response(html, { headers: { 'content-type': 'text/html;charset=utf-8' } })
  }

  if (['/crawl.json', '/trust.json'].includes(url.pathname)) {
    const json = await kv.get(url.pathname.slice(1)) || '{}'
    return new Response(json, { headers: { 'content-type': 'application/json' } })
  }

  return new Response('not found', { status: 404 })
}

export default {
  fetch: (req, env) => handleRequest(req, env),
  scheduled: (event, env, ctx) => ctx.waitUntil(runCrawl(env))
}
