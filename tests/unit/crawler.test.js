import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateFeed, normalizeIdentities } from '../../src/crawler.js'

const validFeed = {
  identities: [
    { public_key: 'abc123' },
    { public_key: 'def456' }
  ]
}

test('validateFeed: accepts valid feed', () => {
  assert.equal(validateFeed(validFeed), true)
})

test('validateFeed: rejects null', () => {
  assert.equal(validateFeed(null), false)
})

test('validateFeed: rejects missing identities', () => {
  assert.equal(validateFeed({}), false)
})

test('validateFeed: rejects empty identities array', () => {
  assert.equal(validateFeed({ identities: [] }), false)
})

test('validateFeed: rejects non-array identities', () => {
  assert.equal(validateFeed({ identities: 'nope' }), false)
})

test('validateFeed: rejects identity missing public_key', () => {
  assert.equal(validateFeed({ identities: [{ display_name: 'No Key' }] }), false)
})

test('normalizeIdentities: attaches source domain', () => {
  const url = 'https://example.com/identity.json'
  const result = normalizeIdentities(validFeed, url)
  assert.equal(result.length, 2)
  assert.equal(result[0].domain, 'example.com')
  assert.equal(result[0].public_key, 'abc123')
})

test('normalizeIdentities: does not mutate original', () => {
  const url = 'https://example.com/identity.json'
  normalizeIdentities(validFeed, url)
  assert.equal(validFeed.identities[0].domain, undefined)
})
