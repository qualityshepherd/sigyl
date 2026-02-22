# Sigyl
_Small, trusted groups. Domain as collateral. Totally free._

## What it is

A lightweight, human-dependent web of trust. You publish a small JSON file on a domain you own. A human who knows you vouches for it on their mirror (static site) on their own domain. That's it.

No servers. No database. No blockchain. No algorithm. **_Humans required_**.

## How it works

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

## What it's good for

- A TTRPG table verifying everyone rolling dice is actually Dave
- A zine collective confirming contributors are real humans
- A fediverse community tired of bot accounts
- A friend group that wants a shared identity layer without a platform
- Anything where "is this actually a real person I know" matters
- Defending against AI-generated fake identities at the community level

## What it's not

Not a social network. Not auth. Not a passport. Not trying to scale to a billion users.

It's a directory of humans vouched by other humans. Apps build on top. The protocol doesn't care what they do with it.

## Why not PGP?

PGP tried this. It failed — not cryptographically, but socially. Key-signing parties, expiring keys, tooling nobody used. Trust rotted because there was no stake.

Sigyl flips it: trust is operator-curated, not social-graph-emergent. Your mirror, your reputation, your call. And a domain costs $10/year — that's the stake PGP never had.

## Why it can't be captured

- No company owns the protocol
- No server owns your identity
- The thing that makes it work is a file on your website
- Human vouching doesn't scale for bots — feature, not bug
- Narrow by design — it refuses to solve everything

## Run your own mirror

```
git clone https://github.com/qualityshepherd/sigyl
```

Add domains to `seeds.txt`. Vouch them in `trust.json`. Push to GitHub Pages. Free forever except your domain.

You decide who's on it. You vouch for them with your reputation. Most mirrors will have 5–20 people. That's not a limitation — that's the architecture working.

## The stack

Node.js. Static JSON. GitHub Actions. No database. No server. No framework. No VC. Humans required.

## License

MIT — brine
