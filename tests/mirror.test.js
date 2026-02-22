import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadTrust, discoverStrangers } from '../../src/mirror.js'
import { getStatus, VOUCH, STRANGER, BLOCK } from '../../src/trust.js'

test('loadTrust: returns object', async () => {
  const trust = await loadTrust()
  assert.equal(typeof trust, 'object')
})

test('trust: vouched domains get crawled and shown', () => {
  const trust = { 'brine.dev': 'vouch' }
  assert.equal(getStatus(trust, 'brine.dev'), VOUCH)
})

test('trust: strangers get crawled but not shown', () => {
  const trust = { 'unknown.com': 'stranger' }
  assert.equal(getStatus(trust, 'unknown.com'), STRANGER)
})

test('trust: blocked domains are ignored', () => {
  const trust = { 'shitba.gs': 'block' }
  assert.equal(getStatus(trust, 'shitba.gs'), BLOCK)
})

test('discoverStrangers: finds new domains not in trust', () => {
  const identities = [
    { domain: 'alice.net', public_key: 'abc', mirror: 'https://sigyl.org' },
    { domain: 'brine.dev', public_key: 'def', mirror: 'https://sigyl.org' }
  ]
  const trust = { 'brine.dev': 'vouch' }
  const discovered = discoverStrangers(identities, trust)

  assert.equal(discovered['alice.net'], 'stranger')
  assert.equal(discovered['brine.dev'], undefined)
})

test('discoverStrangers: ignores blocked patterns', () => {
  const identities = [
    { domain: 'evil.ai', public_key: 'abc', mirror: 'https://sigyl.org' }
  ]
  const trust = { block_patterns: ['*.ai'] }
  const discovered = discoverStrangers(identities, trust)

  assert.equal(discovered['evil.ai'], undefined)
})

test('discoverStrangers: returns empty when nothing new', () => {
  const identities = [
    { domain: 'brine.dev', public_key: 'abc', mirror: 'https://sigyl.org' }
  ]
  const trust = { 'brine.dev': 'vouch' }
  const discovered = discoverStrangers(identities, trust)

  assert.deepEqual(discovered, {})
})
