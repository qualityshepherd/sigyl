import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateFeed, normalizeIdentities } from '../../src/crawler.js'

const validFeed = {
  identities: [
    { public_key: 'abc123', mirror: 'https://sigyl.org' },
    { public_key: 'def456', mirror: 'https://sigyl.org' }
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

test('validateFeed: rejects identity missing public_key', () => {
  assert.equal(validateFeed({ identities: [{ mirror: 'https://sigyl.org' }] }), false)
})

test('validateFeed: rejects identity missing mirror', () => {
  assert.equal(validateFeed({ identities: [{ public_key: 'abc123' }] }), false)
})

test('normalizeIdentities: attaches source domain', () => {
  const url = 'https://brine.dev/identity.json'
  const result = normalizeIdentities(validFeed, url)
  assert.equal(result.length, 2)
  assert.equal(result[0].domain, 'brine.dev')
  assert.equal(result[0].public_key, 'abc123')
  assert.equal(result[0].mirror, 'https://sigyl.org')
})

test('normalizeIdentities: does not mutate original', () => {
  const url = 'https://brine.dev/identity.json'
  normalizeIdentities(validFeed, url)
  assert.equal(validFeed.identities[0].domain, undefined)
})
