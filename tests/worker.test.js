import { env, SELF, fetchMock } from 'cloudflare:test'
import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { getTrustState, isMirror, isBlocked, crawl, runCrawl, generateIndex } from '../src/worker.js'

beforeAll(() => fetchMock.activate())
afterEach(() => fetchMock.assertNoPendingInterceptors())

const req = (path, opts = {}) =>
  new Request(`https://sigyl.test${path}`, opts)

const get = (path) => SELF.fetch(req(path))

const authed = (path) => SELF.fetch(req(`${path}?token=test-token`))

describe('routing', () => {
  it('serves index.html from KV', async () => {
    await env.SIGYL_KV.put('index.html', '<html>test</html>')
    const res = await get('/')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
    expect(await res.text()).toContain('test')
  })

  it('serves crawl.json from KV', async () => {
    await env.SIGYL_KV.put('crawl.json', '{"crawled_at":"2026-01-01"}')
    const res = await get('/crawl.json')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/json')
  })

  it('serves trust.json from KV', async () => {
    await env.SIGYL_KV.put('trust.json', '{"brine.dev":"vouch"}')
    const res = await get('/trust.json')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body['brine.dev']).toBe('vouch')
  })

  it('returns 404 for unknown routes', async () => {
    const res = await get('/nope')
    expect(res.status).toBe(404)
  })

  it('returns 401 for admin without token', async () => {
    const res = await get('/admin')
    expect(res.status).toBe(401)
  })

  it('returns 200 for admin with valid token', async () => {
    const res = await authed('/admin')
    expect(res.status).toBe(200)
  })
})

describe('trust graph', () => {
  it('recognizes vouch state', () => {
    expect(getTrustState({ 'brine.dev': 'vouch' }, 'brine.dev')).toBe('vouch')
  })

  it('recognizes stranger state', () => {
    expect(getTrustState({ 'brine.dev': 'stranger' }, 'brine.dev')).toBe('stranger')
  })

  it('recognizes block state', () => {
    expect(getTrustState({ 'brine.dev': 'block' }, 'brine.dev')).toBe('block')
  })

  it('treats unknown domains as strangers', () => {
    expect(getTrustState({}, 'unknown.dev')).toBe('stranger')
  })

  it('blocks domains matching block_patterns', () => {
    const trust = { block_patterns: ['spam.dev'] }
    expect(isBlocked(trust, 'spam.dev')).toBe(true)
    expect(isBlocked(trust, 'legit.dev')).toBe(false)
  })

  it('blocks subdomains matching wildcard block_patterns', () => {
    const trust = { block_patterns: ['*.spam.dev'] }
    expect(isBlocked(trust, 'sub.spam.dev')).toBe(true)
    expect(isBlocked(trust, 'spam.dev')).toBe(false)
    expect(isBlocked(trust, 'legit.dev')).toBe(false)
  })

  it('distinguishes mirror domains from participant domains', () => {
    const trust = {
      'sigyl.org': { trust: 'vouch', mirror: true },
      'brine.dev': 'vouch'
    }
    expect(isMirror(trust, 'sigyl.org')).toBe(true)
    expect(isMirror(trust, 'brine.dev')).toBe(false)
  })
})

describe('crawler', () => {
  it('discovers new domains from mirror trust graphs as strangers', async () => {
    const remoteTrust = { 'discovered.dev': 'vouch', block_patterns: [] }
    fetchMock
      .get('https://other-mirror.dev')
      .intercept({ path: '/trust.json' })
      .reply(200, JSON.stringify(remoteTrust))

    const { strangers } = await crawl({
      'other-mirror.dev': { trust: 'vouch', mirror: true }
    }, 'sigyl.test')

    expect(strangers).toContain('discovered.dev')
  })

  it('does not crawl blocked domains', async () => {
    await env.SIGYL_KV.put('trust.json', JSON.stringify({
      'evil.dev': 'block',
      block_patterns: ['*.bad']
    }))
    const result = await runCrawl(env)
    expect(result.identities.some(i => i.domain === 'evil.dev')).toBe(false)
  })

  it('does not crawl stranger domains', async () => {
    await env.SIGYL_KV.put('trust.json', JSON.stringify({
      'unknown.dev': 'stranger'
    }))
    const result = await runCrawl(env)
    expect(result.identities).toContainEqual({ domain: 'unknown.dev', trust: 'stranger' })
    expect(result.errors.some(e => e.domain === 'unknown.dev')).toBe(false)
  })
})

describe('crawl.json', () => {
  it('includes crawled_at timestamp', async () => {
    await env.SIGYL_KV.put('trust.json', JSON.stringify({ 'a.dev': 'vouch' }))
    await runCrawl(env)
    const crawl = JSON.parse(await env.SIGYL_KV.get('crawl.json'))
    expect(crawl.crawled_at).toBeDefined()
    expect(new Date(crawl.crawled_at).getTime()).toBeLessThanOrEqual(Date.now())
  })
})

describe('admin', () => {
  it('lists strangers waiting for review', async () => {
    await env.SIGYL_KV.put('trust.json', JSON.stringify({ 'rando.dev': 'stranger' }))
    const res = await authed('/admin')
    const html = await res.text()
    expect(html).toContain('rando.dev')
  })

  it('vouches a stranger domain', async () => {
    await env.SIGYL_KV.put('trust.json', JSON.stringify({ 'rando.dev': 'stranger' }))
    const res = await SELF.fetch(req('/admin/trust?token=test-token&domain=rando.dev&state=vouch'), { redirect: 'manual' })
    expect(res.status).toBe(302)
    const trust = JSON.parse(await env.SIGYL_KV.get('trust.json'))
    expect(trust['rando.dev']).toBe('vouch')
  })

  it('blocks a stranger domain', async () => {
    await env.SIGYL_KV.put('trust.json', JSON.stringify({ 'rando.dev': 'stranger' }))
    const res = await SELF.fetch(req('/admin/trust?token=test-token&domain=rando.dev&state=block'), { redirect: 'manual' })
    expect(res.status).toBe(302)
    const trust = JSON.parse(await env.SIGYL_KV.get('trust.json'))
    expect(trust['rando.dev']).toBe('block')
  })

  it('upgrades a stranger to a mirror', async () => {
    await env.SIGYL_KV.put('trust.json', JSON.stringify({ 'peer-mirror.com': 'stranger' }))
    const res = await SELF.fetch(req('/admin/trust?token=test-token&domain=peer-mirror.com&state=mirror'), { redirect: 'manual' })
    expect(res.status).toBe(302)
    const trust = JSON.parse(await env.SIGYL_KV.get('trust.json'))
    expect(trust['peer-mirror.com']).toEqual({ trust: 'vouch', mirror: true })
  })

  it('rejects action without valid token', async () => {
    const res = await get('/admin/trust?domain=rando.dev&state=vouch')
    expect(res.status).toBe(401)
  })
})

describe('index.html', () => {
  it('renders vouched identities and mirrors correctly', () => {
    const identities = [
      { domain: 'brine.dev', trust: 'vouch' },
      { domain: 'other-mirror.dev', trust: 'vouch', mirror: true }
    ]
    const html = generateIndex(identities, 'sigyl.test', new Date().toISOString())
    expect(html).toContain('brine.dev')
    expect(html).toContain('other-mirror.dev')
    expect(html).toContain('mirror')
  })

  it('excludes non-vouched domains from display', async () => {
    await env.SIGYL_KV.put('trust.json', JSON.stringify({
      'blocked.dev': 'block',
      'stranger.dev': 'stranger'
    }))
    await runCrawl(env)
    const res = await get('/')
    const html = await res.text()
    expect(html).not.toContain('blocked.dev')
    expect(html).not.toContain('stranger.dev')
  })
})
