import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createTrustList, vouch, block, getStatus, matchesPattern, validateTrust, VOUCH, BLOCK, STRANGER } from '../../src/trust.js'

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

test('validateTrust: accepts valid trust object', () => {
  const trust = {
    'brine.dev': 'vouch',
    'shitba.gs': 'block',
    'new.mirror': 'stranger',
    block_patterns: ['*.ai']
  }
  assert.equal(validateTrust(trust), true)
})

test('validateTrust: rejects invalid state', () => {
  assert.throws(() => validateTrust({ 'brine.dev': 'maybe' }), /invalid trust state/)
})

test('validateTrust: rejects non-array block_patterns', () => {
  assert.throws(() => validateTrust({ block_patterns: '*.ai' }), /must be an array/)
})

test('validateTrust: rejects non-object', () => {
  assert.throws(() => validateTrust(null), /must be a JSON object/)
})

test('validateTrust: rejects array', () => {
  assert.throws(() => validateTrust([]), /must be a JSON object/)
})
