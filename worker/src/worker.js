// ---- trust ----

const VOUCH = 'vouch'
const BLOCK = 'block'
const STRANGER = 'stranger'

const VALID_STATES = new Set([VOUCH, BLOCK, STRANGER])

function getStatus (list, domain) {
  return list[domain] || STRANGER
}

function matchesPattern (list, domain) {
  const patterns = list.block_patterns || []
  return patterns.some(pattern => {
    if (pattern.startsWith('*.')) {
      return domain.endsWith('.' + pattern.slice(2))
    }
    return domain === pattern
  })
}

function validateTrust (trust) {
  if (!trust || typeof trust !== 'object' || Array.isArray(trust)) {
    throw new Error('trust.json must be a JSON object')
  }
  for (const [key, val] of Object.entries(trust)) {
    if (key === 'block_patterns') {
      if (!Array.isArray(val)) throw new Error('block_patterns must be an array')
      continue
    }
    if (!VALID_STATES.has(val)) {
      throw new Error(`invalid trust state for "${key}": "${val}"`)
    }
  }
  return true
}

// ---- crawler ----

const REQUIRED_FIELDS = ['public_key', 'mirror']

function validateFeed (feed) {
  if (!feed) return false
  if (feed.public_key && feed.mirror) return true
  if (!Array.isArray(feed.identities) || feed.identities.length === 0) return false
  return feed.identities.every(i => REQUIRED_FIELDS.every(f => i[f] !== undefined))
}

function normalizeFeed (feed, domain) {
  if (feed.public_key) {
    return [{ domain, public_key: feed.public_key, mirror: feed.mirror }]
  }
  return feed.identities.map(i => ({ domain, public_key: i.public_key, mirror: i.mirror }))
}

async function fetchFeed (url) {
  try {
    const res = await fetch(url, { cf: { cacheTtl: 0 } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error(`Failed to fetch ${url}:`, err.message)
    return null
  }
}

async function crawlDomains (domains) {
  const all = []
  for (const domain of domains) {
    const url = `https://${domain}/sigyl.json`
    const feed = await fetchFeed(url)
    if (!validateFeed(feed)) continue
    all.push(...normalizeFeed(feed, domain))
  }
  return all
}

// ---- html generator ----

function generateIndex (identities, mirrorDomain, crawledAt) {
  const items = identities.map(i => `
  <li class="identity">
    <a href="https://${i.domain}" rel="me">${i.domain}</a>
    <span class="check">&#10003;</span>
  </li>`).join('\n')

  const list = identities.length
    ? `<ul>\n${items}\n  </ul>`
    : `<span class="empty">no vouched identities yet</span>`

  const crawlLine = crawledAt
    ? `<span class="crawled">last crawled: ${new Date(crawledAt).toUTCString()} &mdash; <a href="/crawl.json">crawl.json</a></span>`
    : `<span class="crawled"><a href="/crawl.json">crawl.json</a></span>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${mirrorDomain} / sigyl</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
<main class="wrap">
  <header>
    <h1>${mirrorDomain}</h1>
    <nav>
      <a href="/why">why</a>
      <a href="/about">about</a>
      <a href="/keygen">keygen</a>
    </nav>
  </header>
  ${list}
  <footer>
    ${crawlLine}<br>
    <a href="/about">sigyl</a> &mdash; MIT license &mdash; <a href="https://github.com/qualityshepherd/sigyl" rel="noopener">source</a>
  </footer>
</main>
</body>
</html>`
}

// ---- KV helpers ----

async function loadTrust (kv) {
  const raw = await kv.get('trust.json')
  if (!raw) throw new Error('trust.json not found in KV')
  const trust = JSON.parse(raw)
  validateTrust(trust)
  return trust
}

async function saveTrust (kv, trust) {
  validateTrust(trust)
  await kv.put('trust.json', JSON.stringify(trust, null, 2))
}

// ---- email notification ----

async function notify (env, newStrangers) {
  if (!newStrangers.length || !env.ADMIN_EMAIL) return
  const body = `sigyl: ${newStrangers.length} new domain(s) discovered\n\n${newStrangers.join('\n')}\n\nhttps://${env.MIRROR_DOMAIN}/admin?token=${env.ADMIN_TOKEN}`
  await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: env.ADMIN_EMAIL }] }],
      from: { email: `sigyl@${env.MIRROR_DOMAIN}`, name: 'sigyl' },
      subject: `sigyl: ${newStrangers.length} new stranger(s)`,
      content: [{ type: 'text/plain', value: body }]
    })
  })
}

// ---- crawl ----

async function runCrawl (env) {
  const kv = env.SIGYL_KV
  const crawledAt = new Date().toISOString()
  let trust = await loadTrust(kv)

  const domains = Object.entries(trust)
    .filter(([key, val]) => key !== 'block_patterns' && val === VOUCH)
    .map(([domain]) => domain)

  const identities = await crawlDomains(domains)

  const newStrangers = []
  for (const i of identities) {
    if (!trust[i.domain] && !matchesPattern(trust, i.domain)) {
      trust[i.domain] = STRANGER
      newStrangers.push(i.domain)
    }
  }
  if (newStrangers.length) await saveTrust(kv, trust)

  const vouched = identities.filter(i =>
    getStatus(trust, i.domain) === VOUCH && !matchesPattern(trust, i.domain)
  )

  const html = generateIndex(vouched, env.MIRROR_DOMAIN, crawledAt)
  const log = {
    crawled_at: crawledAt,
    mirror: env.MIRROR_DOMAIN,
    vouched: vouched.length,
    discovered: newStrangers,
    results: domains.map(domain => ({
      domain,
      status: identities.find(i => i.domain === domain) ? 'ok' : 'failed',
      trust: getStatus(trust, domain)
    }))
  }

  await Promise.all([
    kv.put('index.html', html),
    kv.put('crawl.json', JSON.stringify(log, null, 2))
  ])

  await notify(env, newStrangers)
  return log
}

// ---- admin page ----

function adminPage (trust, mirrorDomain, token) {
  const strangers = Object.entries(trust)
    .filter(([k, v]) => k !== 'block_patterns' && v === STRANGER)

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
  <style>
    .stranger-row { display: flex; justify-content: space-between; align-items: baseline; padding: 0.4rem 0; }
    .actions { white-space: nowrap; }
    .action-link { background: none; border: none; color: var(--bright); font: inherit; cursor: pointer; padding: 0; }
    .action-link:hover { color: var(--orange); }
  </style>
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

// ---- router ----

async function handleRequest (request, env) {
  const url = new URL(request.url)
  const kv = env.SIGYL_KV
  const token = env.ADMIN_TOKEN

  if (url.pathname === '/' || url.pathname === '/index.html') {
    const html = await kv.get('index.html')
    if (!html) return new Response('not crawled yet -- run wrangler dev --test-scheduled', { status: 503 })
    return new Response(html, { headers: { 'content-type': 'text/html;charset=utf-8' } })
  }

  // temp debug route
  if (url.pathname === '/crawl-now' && url.searchParams.get('token') === token) {
    try {
      const log = await runCrawl(env)
      return new Response(JSON.stringify(log, null, 2), { headers: { 'content-type': 'application/json' } })
    } catch (err) {
      return new Response(err.message + '\n' + err.stack, { status: 500 })
    }
  }

  if (url.pathname === '/crawl.json') {
    const json = await kv.get('crawl.json')
    if (!json) return new Response('{}', { headers: { 'content-type': 'application/json' } })
    return new Response(json, { headers: { 'content-type': 'application/json' } })
  }

  if (url.pathname === '/trust.json') {
    const json = await kv.get('trust.json')
    return new Response(json, { headers: { 'content-type': 'application/json' } })
  }

  if (url.pathname.startsWith('/admin')) {
    if (url.searchParams.get('token') !== token) {
      return new Response('unauthorized', { status: 401 })
    }

    if (url.pathname === '/admin/trust') {
      const domain = url.searchParams.get('domain')
      const state = url.searchParams.get('state')
      if (!domain || !['vouch', 'block'].includes(state)) {
        return new Response('bad request', { status: 400 })
      }
      const trust = await loadTrust(kv)
      trust[domain] = state
      await saveTrust(kv, trust)
      return Response.redirect(`https://${env.MIRROR_DOMAIN}/admin?token=${token}`, 302)
    }

    const trust = await loadTrust(kv)
    return new Response(adminPage(trust, env.MIRROR_DOMAIN, token), {
      headers: { 'content-type': 'text/html;charset=utf-8' }
    })
  }

  return new Response('not found', { status: 404 })
}

// ---- entry points ----

export default {
  async fetch (request, env) {
    return handleRequest(request, env)
  },

  async scheduled (event, env, ctx) {
    ctx.waitUntil(runCrawl(env))
  }
}
