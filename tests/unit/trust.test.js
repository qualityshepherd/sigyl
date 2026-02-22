import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createTrustList, vouch, block, getStatus, matchesPattern, VOUCH, BLOCK, STRANGER } from '../../src/trust.js'

test('createTrustList: returns empty object', () => {
  assert.deepEqual(createTrustList(), {})
})

test('vouch: adds vouch status', () => {
  const list = vouch(createTrustList(), 'brine.dev')
  assert.equal(getStatus(list, 'brine.dev'), VOUCH)
})

test('block: adds block status', () => {
  const list = block(createTrustList(), 'shitba.gs')
  assert.equal(getStatus(list, 'shitba.gs'), BLOCK)
})

test('getStatus: returns stranger for unknown domain', () => {
  assert.equal(getStatus({}, 'unknown.com'), STRANGER)
})

test('vouch: does not mutate original', () => {
  const original = createTrustList()
  vouch(original, 'brine.dev')
  assert.deepEqual(original, {})
})

test('matchesPattern: matches wildcard tld', () => {
  const list = { block_patterns: ['*.ai'] }
  assert.equal(matchesPattern(list, 'evil.ai'), true)
})

test('matchesPattern: matches exact in patterns', () => {
  const list = { block_patterns: ['*.ai', 'bad.com'] }
  assert.equal(matchesPattern(list, 'bad.com'), true)
})

test('matchesPattern: does not match unrelated domain', () => {
  const list = { block_patterns: ['*.ai'] }
  assert.equal(matchesPattern(list, 'brine.dev'), false)
})

test('matchesPattern: returns false with no patterns', () => {
  assert.equal(matchesPattern({}, 'brine.dev'), false)
})

test('matchesPattern: wildcard does not match bare tld', () => {
  const list = { block_patterns: ['*.ai'] }
  assert.equal(matchesPattern(list, 'ai'), false)
})
