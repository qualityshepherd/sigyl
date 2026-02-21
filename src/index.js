import { publicKeyToWords } from './words.js'

function renderIdentity (identity) {
  const fingerprint = publicKeyToWords(identity.public_key)
  const domain = identity.domain

  return `
    <li class="identity">
      <a href="https://${domain}" rel="me">${domain}</a>
      <span class="check">&#10003;</span>
      <code class="fingerprint">${fingerprint}</code>
    </li>`
}

export function generateIndex (identities, mirrorDomain) {
  const list = identities.length
    ? `<ul>\n${identities.map(renderIdentity).join('\n')}\n    </ul>`
    : `<p class="empty">no vouched identities yet</p>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${mirrorDomain} - Sigyl Mirror</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <div class="wrap">
    <header>
      <h1>${mirrorDomain}</h1>
      <nav>
        <a href="/about">about</a>
        <a href="/keygen">keygen</a>
      </nav>
    </header>
    <p>Vouched identities on this mirror.</p>
    ${list}
    <footer>
      <a href="/about">sigyl</a> &mdash; MIT license &mdash; <a href="https://github.com/qualityshepherd/sigyl" rel="noopener">source</a>
    </footer>
  </div>
</body>
</html>`
}
