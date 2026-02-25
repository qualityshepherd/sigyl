// sigyl worker
// A lightweight web of trust. Domain as stake. Humans required.

// ---- constants ----

const VOUCH = 'vouch'
const STRANGER = 'stranger'
const BLOCK = 'block'
const FETCH_TIMEOUT_MS = 5000
const FETCH_MAX_BYTES = 64 * 1024 // 64kb

// ---- trust helpers ----

export function getTrustState (trust, domain) {
  const entry = trust[domain]
  if (!entry) return STRANGER
  if (typeof entry === 'string') return entry
  if (typeof entry === 'object') return entry.trust
  return STRANGER
}

export function isMirror (trust, domain) {
  const entry = trust[domain]
  return typeof entry === 'object' && entry.mirror === true
}

export function isBlocked (trust, domain) {
  if (getTrustState(trust, domain) === BLOCK) return true
  const patterns = trust.block_patterns || []
  return patterns.some(pattern => {
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(2)
      // Only block subdomains (e.g., *.spam.dev blocks sub.spam.dev but not spam.dev)
      return domain.endsWith('.' + suffix)
    }
    return domain === pattern
  })
}

// ---- fetch with limits ----

export async function safeFetch (url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return { error: `http ${res.status}` }
    const reader = res.body.getReader()
    let bytes = 0
    const chunks = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.length
      if (bytes > FETCH_MAX_BYTES) return { error: 'too large' }
      chunks.push(value)
    }
    const text = new TextDecoder().decode(
      chunks.reduce((a, b) => { const c = new Uint8Array(a.length + b.length); c.set(a); c.set(b, a.length); return c }, new Uint8Array(0))
    )
    return { text }
  } catch (err) {
    return { error: err.name === 'AbortError' ? 'timeout' : err.message }
  } finally {
    clearTimeout(timer)
  }
}

// ---- crawler ----

export async function crawl (trust, mirrorDomain) {
  const identities = []
  const errors = []
  const strangers = []

  const domains = Object.keys(trust).filter(k => k !== 'block_patterns')

  for (const domain of domains) {
    if (isBlocked(trust, domain)) continue
    const state = getTrustState(trust, domain)
    if (state === BLOCK) continue

    if (isMirror(trust, domain)) {
      // gossip: fetch their trust graph, discover new domains
      const { text, error } = await safeFetch(`https://${domain}/trust.json`)
      if (error) {
        errors.push({ domain, status: error })
        continue
      }
      try {
        const remoteTrust = JSON.parse(text)
        const remoteDomains = Object.keys(remoteTrust).filter(k => k !== 'block_patterns')
        for (const remote of remoteDomains) {
          if (!trust[remote] && remote !== mirrorDomain) {
            strangers.push(remote)
          }
        }
        identities.push({ domain, trust: state, mirror: true })
      } catch {
        errors.push({ domain, status: 'invalid json' })
      }
      continue
    }

    if (state === STRANGER) {
      // don't crawl strangers, just include them
      identities.push({ domain, trust: STRANGER })
      continue
    }

    // participant: fetch their sigyl.json
    const { text, error } = await safeFetch(`https://${domain}/sigyl.json`)
    if (error) {
      errors.push({ domain, status: error })
      continue
    }
    try {
      const sigyl = JSON.parse(text)
      if (!sigyl.public_key) throw new Error('missing public_key')
      identities.push({ domain, trust: state })
    } catch {
      errors.push({ domain, status: 'invalid sigyl.json' })
    }
  }

  return { identities, errors, strangers }
}

// ---- html generator ----

export function generateIndex (identities, mirrorDomain, crawledAt) {
  const vouched = identities.filter(i => i.trust === VOUCH)
  const rows = vouched.map(({ domain, mirror }) =>
    `  <li><a href="https://${domain}">${domain}</a>${mirror ? ' <span class="mirror">mirror</span>' : ' ✓'}</li>`
  ).join('\n')

  const lastCrawled = crawledAt
    ? `<span class="meta">last crawled: ${new Date(crawledAt).toUTCString()}</span>`
    : `<span class="meta">not crawled yet — run <code>npm run dev</code></span>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${mirrorDomain}</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
<main class="wrap">
  <header>
    <h1>${mirrorDomain}</h1>
    <nav><a href="/why">why</a> <a href="/about">about</a> <a href="/keygen">keygen</a></nav>
  </header>
  <ul class="identities">
${rows}
  </ul>
  <footer>
    ${lastCrawled} — <a href="/crawl.json">crawl.json</a> <a href="https://sigyl.org">sigyl</a>
  </footer>
</main>
</body>
</html>`
}

// ---- admin page ----

function adminPage (trust, mirrorDomain, token) {
  const strangers = Object.entries(trust)
    .filter(([k, v]) => {
      if (k === 'block_patterns') return false
      const state = typeof v === 'string' ? v : v.trust
      return state === STRANGER
    })

  const rows = strangers.map(([domain]) => `
    <div class="stranger-row">
      <a href="https://${domain}" target="_blank">${domain}</a>
      <span class="actions">
        <a class="action-link" href="/admin/trust?token=${token}&domain=${domain}&state=vouch">vouch</a>
        &middot;
        <a class="action-link" href="/admin/trust?token=${token}&domain=${domain}&state=block">block</a>
      </span>
    </div>`).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>sigyl / admin</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
<main class="wrap">
  <header>
    <a href="/">&larr; ${mirrorDomain}</a>
    <h1><span>sigyl /</span> admin</h1>
  </header>
  ${strangers.length
    ? `<div class="strangers">${rows}</div>`
    : `<span class="empty">no strangers waiting</span>`
  }
</main>
</body>
</html>`
}

// ---- notifications ----

async function notify (env, newStrangers) {
  if (!newStrangers.length || !env.ADMIN_EMAIL) return

  const adminUrl = `https://${env.MIRROR_DOMAIN}/admin`
  const body = `${newStrangers.length} new stranger(s) waiting:\n\n${newStrangers.join('\n')}\n\n${adminUrl}`

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

// ---- kv helpers ----

async function loadTrust (kv) {
  const raw = await kv.get('trust.json')
  if (!raw) return { block_patterns: [] }
  return JSON.parse(raw)
}

async function saveTrust (kv, trust) {
  await kv.put('trust.json', JSON.stringify(trust))
}

// ---- crawl runner ----

// EXPORTED: Fixed missing export causing test failures
export async function runCrawl (env) {
  const kv = env.SIGYL_KV
  const trust = await loadTrust(kv)
  const { identities, errors, strangers } = await crawl(trust, env.MIRROR_DOMAIN)

  let newStrangers = []
  for (const domain of strangers) {
    if (!trust[domain]) {
      trust[domain] = STRANGER
      newStrangers.push(domain)
    }
  }
  if (newStrangers.length) await saveTrust(kv, trust)

  const crawlData = {
    crawled_at: new Date().toISOString(),
    identities,
    errors
  }
  await kv.put('crawl.json', JSON.stringify(crawlData))

  const html = generateIndex(identities, env.MIRROR_DOMAIN, crawlData.crawled_at)
  await kv.put('index.html', html)

  await notify(env, newStrangers)
  return crawlData
}

// ---- router ----

async function handleRequest (request, env) {
  const url = new URL(request.url)
  const kv = env.SIGYL_KV
  const token = env.ADMIN_TOKEN

  if (url.pathname === '/admin/trust') {
    const reqToken = url.searchParams.get('token')
    if (reqToken !== token) return new Response('unauthorized', { status: 401 })
    const domain = url.searchParams.get('domain')
    const state = url.searchParams.get('state')
    if (!domain || ![VOUCH, BLOCK].includes(state)) return new Response('bad request', { status: 400 })

    const trust = await loadTrust(kv)
    trust[domain] = state
    await saveTrust(kv, trust)
    return Response.redirect(`https://${env.MIRROR_DOMAIN}/admin?token=${token}`, 302)
  }

  if (url.pathname === '/admin') {
    if (url.searchParams.get('token') !== token) return new Response('unauthorized', { status: 401 })
    const trust = await loadTrust(kv)
    return new Response(adminPage(trust, env.MIRROR_DOMAIN, token), {
      headers: { 'content-type': 'text/html;charset=utf-8' }
    })
  }

  if (url.pathname === '/') {
    const html = await kv.get('index.html') || generateIndex([], env.MIRROR_DOMAIN, null)
    return new Response(html, { headers: { 'content-type': 'text/html;charset=utf-8' } })
  }

  if (url.pathname === '/crawl.json' || url.pathname === '/trust.json') {
    const json = await kv.get(url.pathname.slice(1)) || '{}'
    return new Response(json, { headers: { 'content-type': 'application/json' } })
  }

  return new Response('not found', { status: 404 })
}

export default {
  async fetch (request, env) {
    return handleRequest(request, env)
  },
  async scheduled (event, env, ctx) {
    ctx.waitUntil(runCrawl(env))
  }
}
