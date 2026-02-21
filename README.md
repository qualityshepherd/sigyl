# Sigyl

Decentralized identity and trust protocol. Host your identity on your domain. Vouch for people you trust. Run a mirror.

## identity.json

Publish this at `https://yourdomain.com/identity.json`:

```json
{
  "identities": [
    { "public_key": "your-ed25519-public-key" }
  ]
}
```

That's it.

## Trust

Mirrors maintain three lists:

- **Vouch** - domains you trust
- **Block** - domains you don't
- **Stranger** - everyone else

## Running a mirror

```
node src/mirror.js
```

Add seeds to `seeds.txt`. One `https://domain.com/identity.json` per line. Comments with `#`.

## License

MIT
