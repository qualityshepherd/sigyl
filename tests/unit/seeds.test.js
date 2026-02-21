import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseSeeds, validateSeedUrl } from '../../src/seeds.js'

test('validateSeedUrl: accepts valid identity.json url', () => {
  assert.equal(validateSeedUrl('https://example.com/identity.json'), true)
})

test('validateSeedUrl: rejects http', () => {
  assert.equal(validateSeedUrl('http://example.com/identity.json'), false)
})

test('validateSeedUrl: rejects non-identity json', () => {
  assert.equal(validateSeedUrl('https://example.com/products.json'), false)
})

test('validateSeedUrl: rejects non-url', () => {
  assert.equal(validateSeedUrl('not-a-url'), false)
})

test('validateSeedUrl: rejects empty', () => {
  assert.equal(validateSeedUrl(''), false)
})

test('parseSeeds: parses valid urls', () => {
  const input = `
    https://alice.com/identity.json
    https://bob.org/identity.json
  `
  assert.deepEqual(parseSeeds(input), [
    'https://alice.com/identity.json',
    'https://bob.org/identity.json'
  ])
})

test('parseSeeds: ignores comments', () => {
  const input = `
    # comment
    https://alice.com/identity.json
  `
  assert.deepEqual(parseSeeds(input), ['https://alice.com/identity.json'])
})

test('parseSeeds: deduplicates', () => {
  const input = `
    https://alice.com/identity.json
    https://alice.com/identity.json
  `
  assert.deepEqual(parseSeeds(input), ['https://alice.com/identity.json'])
})

test('parseSeeds: returns empty array for empty input', () => {
  assert.deepEqual(parseSeeds(''), [])
})
