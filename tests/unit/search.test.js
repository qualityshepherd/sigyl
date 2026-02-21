import { test } from 'node:test'
import assert from 'node:assert/strict'
import { searchIdentities } from '../../src/search.js'

const identities = [
  { public_key: 'abc123', domain: 'alice.com' },
  { public_key: 'def456', domain: 'bob.org' },
  { public_key: 'ghi789', domain: 'alice.org' }
]

test('returns all when no query', () => {
  assert.equal(searchIdentities(identities, '').length, 3)
})

test('returns all when query is null', () => {
  assert.equal(searchIdentities(identities, null).length, 3)
})

test('matches by domain', () => {
  assert.equal(searchIdentities(identities, 'alice').length, 2)
})

test('is case insensitive', () => {
  assert.equal(searchIdentities(identities, 'ALICE').length, 2)
})

test('returns empty when no match', () => {
  assert.equal(searchIdentities(identities, 'zzznomatch').length, 0)
})
