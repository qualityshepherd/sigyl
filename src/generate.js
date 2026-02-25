/**
 * Generates the public-facing index page
 */
export function generateIndex (identities, mirrorDomain, crawledAt) {
  const vouched = identities.filter(i => i.trust === 'vouch')

  const items = vouched.map(i => `
    <li class="identity">
      <a href="https://${i.domain}" rel="me">${i.domain}</a>
      ${i.mirror ? ' <span class="mirror">mirror</span>' : ' <span class="check">✓</span>'}
    </li>`).join('\n')

  const list = vouched.length
    ? `<ul class="identities">\n${items}\n  </ul>`
    : '<span class="empty">no vouched identities yet</span>'

  const crawlLine = crawledAt
    ? `<span class="meta">last crawled: ${new Date(crawledAt).toUTCString()}</span>`
    : '<span class="meta">not crawled yet</span>'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${mirrorDomain} / sigyl</title>
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://sigyl.brine.dev/">
  <meta property="og:title" content="sigyl">
  <meta property="og:description" content="A lightweight web of trust. Domain as stake. Humans required.">
  <meta property="og:image" content="https://sigyl.brine.dev/sigyl.png">
  <link rel="stylesheet" href="/style.css">
</head>
<body>
<main class="wrap">
  <header>
    <h1>${mirrorDomain}</h1>
    <nav><a href="/why">why</a> <a href="/about">about</a> <a href="/keygen">keygen</a></nav>
  </header>
  ${list}
  <footer>
    ${crawlLine} &mdash; <a href="/crawl.json">crawl.json</a> &mdash; <a href="https://sigyl.org">sigyl</a>
  </footer>
</main>
</body>
</html>`
}

/**
 * Generates the private admin interface
 */
export function generateAdmin (trust, mirrorDomain, token) {
  const strangers = Object.entries(trust)
    .filter(([k, v]) => {
      if (k === 'block_patterns') return false
      const state = typeof v === 'string' ? v : v.trust
      return state === 'stranger'
    })

  const rows = strangers.map(([domain]) => `
    <div class="stranger-row">
      <a href="https://${domain}" target="_blank">${domain}</a>
      <span class="actions">
        <a class="action-link vouch" href="/admin/trust?token=${token}&domain=${domain}&state=vouch">vouch</a>
        <a class="action-link mirror" href="/admin/trust?token=${token}&domain=${domain}&state=mirror">vouch as mirror</a>
        <a class="action-link block" href="/admin/trust?token=${token}&domain=${domain}&state=block">block</a>
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
  <div class="strangers">
    ${strangers.length ? rows : '<span class="empty">no strangers waiting</span>'}
  </div>
</main>
</body>
</html>`
}
