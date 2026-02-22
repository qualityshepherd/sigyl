# SIGYL
_Small, trusted groups. Domain as collateral. Totally free._

## WHAT IT IS

A lightweight, human-dependent web of trust. You publish a small JSON file on a domain you own. A human who knows you vouches for it on their mirror (static site) on their own domain. That's it.

No servers. No database. No blockchain. No algorithm. **_Humans required_**.

## HOW IT WORKS

Publish this at `yourdomain.com/identity.json`:

```json
{
  "identities": [
    { "public_key": "...", "mirror": "https://sigyl.org" }
  ]
}
```

A mirror is run by a human who vouches for other humans and stakes their own domain and reputation. Three states:

- **Vouch** — I know this person. My domain is behind them.
- **Block** — I don't trust this domain.
- **Stranger** — Haven't decided yet.

No appeals process. No committee. Just humans making decisions about humans, with skin in the game.

**"I swear on my domain"** is the stake.

## WHAT IT'S GOOD FOR

- A TTRPG table verifying everyone rolling dice is actually Dave
- A zine collective confirming contributors are real humans
- A fediverse community tired of bot accounts
- A friend group that wants a shared identity layer without a platform
- Anything where "is this actually a real person I know" matters
- Defending against AI-generated fake identities at the community level

## WHAT IT'S NOT

Not a social network. Not auth. Not a passport. Not trying to scale to a billion users.

It's a directory of humans vouched by other humans. Apps build on top. The protocol doesn't care what they do with it.

## WHY NOT PGP?

PGP tried this. It failed — not cryptographically, but socially. Key-signing parties, expiring keys, tooling nobody used. Trust rotted because there was no stake.

Sigyl flips it: trust is operator-curated, not social-graph-emergent. Your mirror, your reputation, your call. And a domain costs $10/year — that's the stake PGP never had.

## WHY IT CAN'T BE CAPTURED

- No company owns the protocol
- No server owns your identity
- The thing that makes it work is a file on your website
- Human vouching doesn't scale for bots — feature, not bug
- Narrow by design — it refuses to solve everything

## GENERATING _YOUR_ KEY

Go to `sigyl.org/keygen`. Pick a passphrase — a sentence only you would think of. Your favorite obscure movie quote is perfect.

Your passphrase is your key. Same sentence → same key → every time → on any device. No backup needed. No file to lose. No QR code. Just remember your sentence.

Type it again tomorrow and you'll get the exact same public key.

## RUN YOUR OWN MIRROR

1. Buy a domain (~$10/year). This is your stake. Your mirror lives here.
2. Fork this repo
3. Enable GitHub Pages on your fork (Settings → Pages → source: GitHub Actions)
4. Add a repo variable: Settings → Secrets and variables → Actions → Variables → `MIRROR_DOMAIN` = `yourdomain.com`. This is how the mirror knows its own name.
5. Generate your key at `sigyl.org/keygen` and publish `identity.json` on your domain
6. Add your own domain to `seeds.txt` — because your mirror needs to crawl itself to know you exist
7. Vouch your own domain in `trust.json` — because you trust yourself, and the mirror only indexes vouched domains
8. Push. The Action runs, your mirror is live.

```
git clone https://github.com/qualityshepherd/sigyl
```

You decide who's on it. You vouch for them with your reputation. Most mirrors will have 5–20 people. That's not a limitation — that's the architecture working.

## THE STACK

Node.js. Static JSON. GitHub Actions. No database. No server. No framework. No VC. Humans required.

MIT — brine
