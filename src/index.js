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
  const items = identities.map(renderIdentity).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${mirrorDomain} - Sigyl Mirror</title>
  <style>
    body { font-family: monospace; max-width: 640px; margin: 2rem auto; padding: 0 1rem; }
    h1 { font-size: 1rem; }
    ul { list-style: none; padding: 0; }
    .identity { padding: 0.5rem 0; border-bottom: 1px solid #eee; }
    .identity a { font-weight: bold; text-decoration: none; }
    .identity a:hover { text-decoration: underline; }
    .check { color: green; margin: 0 0.5rem; }
    .fingerprint { color: #666; font-size: 0.85rem; display: block; margin-top: 0.25rem; }
  </style>
</head>
<body>
  <h1>${mirrorDomain}</h1>
  <p>Vouched identities on this mirror.</p>
  <ul>
${items}
  </ul>
</body>
</html>`
}
