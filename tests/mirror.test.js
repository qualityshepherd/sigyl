import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadTrust } from '../../src/mirror.js'
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

test('trust: unknown domains are ignored', () => {
  assert.equal(getStatus({}, 'nobody.com'), STRANGER)
})
