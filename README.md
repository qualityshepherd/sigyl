[![pages](https://github.com/qualityshepherd/sigyl/actions/workflows/page.yml/badge.svg)](https://github.com/qualityshepherd/sigyl/actions/workflows/page.yml)

# SIGYL
_Small, trusted groups. Domain as collateral. Totally free._

## WHAT IT IS

**Sigyl** is a domain-based trust index for operators who want visibility without surrendering judgment. Publish a file on a domain you own. Get vouched by a human who knows you. That's it.

No servers. No database. No blockchain. No algorithm. **_Humans required_**.

## HOW IT WORKS

Publish this at `yourdomain.com/sigyl.json`:

```json
{
  "public_key": "your-ed25519-public-key",
  "mirror": "https://sigyl.org"
}
```

A mirror is run by a human who vouches for other humans and stakes their own domain and reputation. The mirror's `trust.json` is the only thing that decides who exists on the network.

Three states:

- **Vouch** — I know this person. My domain is behind them.
- **Block** — I don't trust this domain.
- **Stranger** — Crawled but not shown. Watching.

No appeals process. No committee. Just humans making decisions about humans, with skin in the game.

**"I swear on my domain"** is the stake.

## THE FILE IS THE STAKE

`sigyl.json` must live at your domain root. Not a subdirectory. Not a subdomain. The root.

`yourdomain.com/sigyl.json` — because the domain is the identity. The file at the root proves you control it. That's the whole claim.

A $10/year domain with a JSON file is all it takes to exist in the network. Cheap enough to be accessible. Real enough to mean something.

## WHAT IT'S GOOD FOR

- A TTRPG table verifying everyone rolling dice is actually Dave
- A zine collective confirming contributors are real humans
- A fediverse community tired of bot accounts
- A friend group that wants a shared identity layer without a platform
- Anything where "is this actually a real person I know" matters
- Defending against AI-generated fake identities at the community level

## WHAT IT'S NOT

Not a social network. Not auth. Not a passport. Not trying to scale to a billion users.

It's a trust index. Apps build on top. The protocol doesn't care what they do with it.

Sigyl is not an identity provider — it doesn't issue credentials, it doesn't own your identity, it's not in the chain. Your key lives on your domain. Your domain is yours. Nobody can take it.

**Keys may increase trust. They never grant permission.**

## WHY NOT PGP?

[PGP tried this](https://en.wikipedia.org/wiki/Web_of_trust). It failed — not cryptographically, but socially. Key-signing parties, expiring keys, tooling nobody used. Trust rotted because there was no stake.

Sigyl flips it: trust is operator-curated, not social-graph-emergent. Your mirror, your reputation, your call. And a domain costs $10/year — that's the stake PGP never had.

## WHY IT CAN'T BE CAPTURED

- No company owns the protocol
- No server owns your identity
- The thing that makes it work is a file on your website
- Human vouching doesn't scale for bots — feature, not bug
- Narrow by design — it refuses to solve everything
- Not trying to make trust _scalable_ — **making mistrust cheap and visible**

## THE WEB (HOW GOSSIP WORKS)

Without gossip, Sigyl is just a list. With gossip, it's a web.

During each crawl, your mirror looks at who your vouched mirrors trust. Anyone new gets added to your `trust.json` as a stranger — discovered but not trusted. ONLY humans decide who to trust.

```
you
├── vouch: trustedmirror.org
│   └── discovers: alice.net      → added as stranger
│   └── discovers: bob.org        → added as stranger
└── vouch: friend.mirror
    └── discovers: carol.dev      → added as stranger
    └── discovers: dave.io        → added as stranger

next crawl:
  you promote alice.net to vouch  → now crawled
  you block dave.io               → never crawled
  bob.org and carol.dev sit as strangers → watching
```

**Discovery is automatic. Trust is not.**

No domain gets crawled without a human deciding to vouch it. The web grows through judgment, not automation. That's the whole point.

## TRUST.JSON

Mirror operators only. One file does everything.

```json
{
  "brine.dev": "vouch",
  "afriend.net": "vouch",
  "watching.org": "stranger",
  "shitba.gs": "block",
  "block_patterns": ["*.spam", "*.example.com"]
}
```

- **vouch** — crawled and shown on your mirror. Your reputation behind them.
- **stranger** — crawled but not shown. Watching before you commit.
- **block** — not crawled, not shown. Done.
- **block_patterns** — wildcard blocks. `*.spam` blocks every `.spam` domain.

Everything not listed is ignored. This file is public. Git history is your audit trail.

## BOT RESISTANCE

A bot can buy a domain. A bot can generate a `sigyl.json`. What a bot can't do is get a human mirror admin to vouch it without that admin staking their own domain on it.

A bot farm running its own mirror can vouch itself all day. It just exists in its own isolated trust graph — invisible to every legitimate mirror that didn't vouch it. Two separate webs with no edges between them.

The defense isn't technical. It's social, with technical visibility. Every vouch is public. Every block is public. Bad actors reveal themselves in the data.

## GENERATING YOUR KEY

Go to `sigyl.org/keygen`. Pick a passphrase — a sentence only you would think of. Your favorite obscure movie quote is perfect.

Your passphrase is your key. Same sentence → same key → every time → on any device. No backup needed. No file to lose. No QR code. Just remember your sentence.

PBKDF2 derives a 32-byte seed. That seed becomes an Ed25519 keypair. The math makes brute force expensive. Your weird personal sentence makes the search space astronomical.

Type it again tomorrow and you'll get the exact same public key.

## RUN YOUR OWN MIRROR

1. Buy a domain (~$10/year). This is your stake. Your mirror lives here.
2. Fork this repo
3. Enable GitHub Pages on your fork (Settings → Pages → source: GitHub Actions)
4. Add a repo variable: `MIRROR_DOMAIN` = `yourdomain.com`
5. Generate your key at `sigyl.org/keygen` and publish `sigyl.json` to your domain root
6. Add your domain to `trust.json` as vouch
7. Push. The Action runs at 4:20am UTC daily. Your mirror is live.

```
git clone https://github.com/qualityshepherd/sigyl
```

After each crawl, `crawl.json` is deployed with your mirror — who was found, who failed, who was discovered. Overwritten every run. Check Action history for the audit trail.

You decide who's on it. You vouch for them with your reputation. Most mirrors will have 5–20 people. That's not a limitation — that's the architecture working.

## THE STACK

Node.js. Static JSON. GitHub Actions. No database. No server. No framework. No VC. Humans required.

_MIT — brine_
