export function generateIndex (identities, mirrorDomain, crawledAt) {
  const items = identities.map(identity => `
  <li class="identity">
    <a href="https://${identity.domain}" rel="me">${identity.domain}</a>
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
