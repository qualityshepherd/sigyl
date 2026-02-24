[![pages](https://github.com/qualityshepherd/sigyl/actions/workflows/page.yml/badge.svg)](https://github.com/qualityshepherd/sigyl/actions/workflows/page.yml)

# SIGYL
_Small, trusted groups. Domain as collateral. Humans required. Totally free._

## WHAT IT IS

A lightweight, human-dependent web of trust. Publish a JSON file on a domain you own. A human who knows you vouches for it on their mirror. That's it.

No servers. No database. No blockchain. No algorithm. **Humans required.**

Every other interest graph on the web was extracted from behavior. This one is declared through relationship. The graph doesn't describe what people consume. It describes who people trust.

WebRing 2.0 that brings back Web 1.0

## HOW IT WORKS

Publish this at `yourdomain.com/sigyl.json`:

```json
{
  "public_key": "your-ed25519-public-key",
  "mirror": "https://sigyl.org"
}
```

A mirror is run by a human who vouches for other humans and stakes their own domain and reputation. The mirror's `trust.json` is the only thing that decides who exists on the network. It's written by a human mirror admin.

Three states:

- **Vouch** -- I know this person. My domain is behind them.
- **Block** -- I don't trust this domain.
- **Stranger** -- Discovered through vouched mirrors. Not vouched. Not crawled.

No appeals process. No committee. Just humans making decisions about humans, with skin in the game.

## YOUR DOMAIN IS YOUR STAKE

`yourdomain.com/sigyl.json` -- root only. Not a subdirectory. Not a subdomain. The file at the root proves you control the domain. That's the claim.

Your domain is your reputation. The cost is just enough friction to make bad faith expensive.

## WHAT IT'S GOOD FOR

- A TTRPG table verifying everyone rolling dice is actually Dave
- A zine collective confirming contributors are real humans
- A fediverse community tired of bot accounts
- A friend group that wants a shared identity layer without a platform
- Anything where "is this actually a real person I know" matters
- Defending against AI-generated fake identities at the community level

## WHAT IT'S NOT

Not a social network. Not auth. Not a passport. Not trying to scale to a billion users.

It's a trust index that apps can build on top of. The protocol doesn't care what they do with it.

Sigyl is an identity, not an identity provider. It doesn't issue credentials, it doesn't own your identity, it's not in the chain. Your key lives on your domain. Your domain is yours. Nobody can take it.

**Keys may increase trust. They never grant permission.**

## WHY NOT PGP?

[PGP tried this](https://en.wikipedia.org/wiki/Web_of_trust). It failed -- not cryptographically, but socially. Key-signing parties, expiring keys, tooling nobody used. Trust rotted because there was no stake.

Sigyl flips it: trust is operator-curated, not social-graph-emergent. Your mirror, your reputation, your call. Domain costs are the stake PGP never had.

## WHY IT CAN'T BE CAPTURED

- No company owns the protocol
- No server owns your identity
- The thing that makes it work is a file on your website
- Human vouching doesn't scale for bots -- feature, not bug
- Narrow by design -- it refuses to solve everything
- Not trying to make trust _scalable_ -- **making mistrust cheap and visible**

## THE WEB (HOW GOSSIP WORKS)

Without gossip, Sigyl is just a list. With gossip, it's a web of trust.

During each crawl, your mirror looks at who your vouched mirrors trust. Anyone new gets added to your `trust.json` as a stranger -- discovered but not trusted. ONLY humans decide who to trust.

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

No domain gets crawled without a human deciding to vouch it. The web grows through judgment, not automation. That's the point.

## BOT RESISTANCE

A bot can buy a domain. A bot can generate a `sigyl.json`. What a bot can't do is get a human mirror admin to vouch it without that admin staking their own domain's reputation on it.

A bot farm running its own mirror can vouch itself all day. It just exists in its own isolated trust graph, invisible to every legitimate mirror that didn't vouch it. Two separate webs with no edges between them.

The defense isn't technical. It's social, with technical visibility. Every vouch is public. Every block is public. Bad actors reveal themselves in the data.

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

- **vouch** -- crawled and shown on your mirror. Your reputation behind them.
- **stranger** -- discovered but not vouched. Not crawled.
- **block** -- not crawled, not shown. Done.
- **block_patterns** -- wildcard blocks. `*.spam` blocks every `.spam` domain.

Everything not listed is ignored. This file is public. Git history is your audit trail.

## GENERATING YOUR KEY

Go to `sigyl.org/keygen`. Pick a passphrase -- a sentence only you would think of. Your favorite obscure movie quote is perfect.

Your passphrase is your key. Same sentence, same key, every time, on any device. No backup needed. No file to lose. No QR code. Just remember your sentence.

PBKDF2 derives a 32-byte seed. That seed becomes an Ed25519 keypair. The math makes brute force incredibly expensive. Your weird personal sentence makes the expense astronomical.

## RUN YOUR OWN MIRROR

1. Buy a domain (~$10/year). This is your stake. Your mirror lives here.
1. Fork this repo
1. Enable GitHub Pages on your fork (Settings > Pages > source: GitHub Actions)
1. Add a repo variable: `MIRROR_DOMAIN` = `yourdomain.com`
1. Generate your key at `sigyl.org/keygen` and publish `sigyl.json` to your domain root
1. Add your domain to `trust.json` as `vouch`
1. Push. The Action runs at 4:20am UTC daily. Your mirror is live.

After each crawl, `crawl.json` is deployed with your mirror: who was found, who failed, who was discovered. Overwritten every run. Check Action history for the audit trail.

You decide who's on it. You vouch for them with your reputation. Most mirrors will have 5-20 people. That's not a limitation, that's the architecture working.

## THE STACK

Node.js. Static JSON. GitHub Actions. No database. No server. No framework. No VC. Humans required.

_MIT -- brine_
