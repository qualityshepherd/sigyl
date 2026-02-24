# sigyl worker

Cloudflare Worker mirror. No GitHub Actions. Runs on your domain. Shares `../public` with the main repo.

## Setup

All commands run from the `worker/` directory.

**1. Create KV namespace**
```bash
wrangler kv namespace create SIGYL_KV
```
Copy the `id` into `wrangler.toml` where it says `REPLACE_WITH_KV_ID`.

**2. Configure wrangler.toml**

Only `MIRROR_DOMAIN` lives in `wrangler.toml`. Everything sensitive is a secret.

```toml
[vars]
MIRROR_DOMAIN = "sigyl.yourdomain.com"
```

**3. Set secrets**
```bash
wrangler secret put ADMIN_TOKEN
wrangler secret put ADMIN_EMAIL
```

`ADMIN_TOKEN` -- any sentence you'll remember. Protects `/admin`. Don't reuse your sigyl passphrase.

`ADMIN_EMAIL` -- your carrier email-to-SMS gateway:
- Google Fi: `number@msg.fi.google.com`
- Verizon: `number@vtext.com`
- AT&T: `number@txt.att.net`
- T-Mobile: `number@tmomail.net`

**4. Seed trust.json in production KV**

Use `--remote` or it only seeds local KV and the production crawl will fail.

```bash
wrangler kv key put --binding=SIGYL_KV trust.json '{"yourdomain.com":"vouch","block_patterns":[]}' --remote
```

**5. Deploy**
```bash
wrangler deploy
```

**6. Add custom domain**

Do NOT add a CNAME manually. Use the Worker dashboard:
- Workers & Pages > sigyl > Settings > Custom Domains
- Add `sigyl.yourdomain.com`

Cloudflare creates the DNS record automatically.

**7. Trigger first crawl**

Change cron in `wrangler.toml` to fire every minute:
```toml
crons = ["*/1 * * * *"]
```
Deploy, wait a minute, check your domain. Then change back:
```toml
crons = ["20 4 * * *"]
```
Deploy again.

## Local testing

```bash
wrangler dev --test-scheduled
```

In another terminal:
```bash
curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"
```

Note: local dev uses a local KV simulation, not production KV. Changes made locally don't affect production and vice versa.

## Admin

`https://sigyl.yourdomain.com/admin?token=YOURTOKEN`

Strangers appear here after each crawl. One click to vouch or block. You get a text when new strangers arrive.

## Debugging

**"not crawled yet"** -- trust.json missing from production KV. Run step 4 with `--remote`.

**cron not firing** -- no manual trigger on free plan. Change cron to `*/1 * * * *`, deploy, wait, change back.

**custom domain 522 error** -- you added a CNAME manually. Delete it, use Custom Domains in Worker settings instead.

## Architecture

- Cron fires at 4:20am UTC
- Crawler fetches all vouched `sigyl.json` files
- New strangers added to KV, text sent to admin via email-to-SMS gateway
- `index.html` and `crawl.json` written to KV
- Static files served from `../public` via Workers Static Assets
- Dynamic routes (`/`, `/crawl.json`, `/trust.json`, `/admin`) handled by worker
