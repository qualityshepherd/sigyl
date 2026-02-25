# sigyl

A lightweight web of trust. Domain as stake. Humans required.

Your domain is your identity. A human who knows you vouches for it. That's the whole protocol.

## how it works

1. You publish a `sigyl.json` at your domain root with your public key
2. A mirror admin vouches your domain; staking their domain's reputation
3. The mirror crawls your `sigyl.json` daily, verifies your key, lists you
4. Other mirrors gossip: they discover who you vouch for, you discover who they vouch for
5. Strangers surface to admins for human review, and vouch or block

No algorithm. No platform. No VC. Humans required to manually `vouch` identities.

## the stake

Your domain costs money. It has your name on it. When a mirror admin vouches your domain, they're saying "I know this person." That costs something too... their reputation, on their domain.

Vouching a bot or a bad actor reflects on you. That's the whole security model.

## join

1. Generate a keypair at [sigyl.org/keygen](https://sigyl.org/keygen)
2. Publish `sigyl.json` at your domain root:

```json
{
  "public_key": "your-ed25519-public-key-base64"
}
```

3. Ask a mirror admin to vouch you or run your own mirror

## run a mirror

Mirrors are Cloudflare Workers. Free tier. No GitHub required.

See [worker/README.md](worker/README.md) for setup.

## the protocol

```
sigyl.json   - identity file, lives at domain root
trust.json   - mirror's trust graph, private to the mirror
crawl.json   - public crawl results
/admin       - human review interface
```

Trust states: `vouch` · `stranger` · `block`

Mirror domains use `{ "trust": "vouch", "mirror": true }` in trust.json. Mirrors share gossip but don't have their own sigyl.json; they're infrastructure, not identities.

## what it isn't

Not auth. Not a social network. Not a platform. Not a replacement for PGP.

Not auth *yet*... but the pieces are there.

## the stack

- Cloudflare Workers = runtime
- Workers KV = trust graph + crawl results
- Workers Static Assets = public files
- Ed25519 = keypairs
- MailChannels = email-to-SMS notifications
- Zero production dependencies

_MIT ~brine_
