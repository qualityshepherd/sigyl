import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseSeeds, validateSeedDomain, seedToUrl } from '../../src/seeds.js'

test('validateSeedDomain: accepts valid domain', () => {
  assert.equal(validateSeedDomain('brine.dev'), true)
})

test('validateSeedDomain: accepts subdomain', () => {
  assert.equal(validateSeedDomain('worldof.brine.dev'), true)
})

test('validateSeedDomain: rejects url with protocol', () => {
  assert.equal(validateSeedDomain('https://brine.dev'), false)
})

test('validateSeedDomain: rejects url with path', () => {
  assert.equal(validateSeedDomain('brine.dev/identity.json'), false)
})

test('validateSeedDomain: rejects no dot', () => {
  assert.equal(validateSeedDomain('localhost'), false)
})

test('validateSeedDomain: rejects empty', () => {
  assert.equal(validateSeedDomain(''), false)
})

test('parseSeeds: parses valid domains', () => {
  const input = `
    brine.dev
    worldof.brine.dev
  `
  assert.deepEqual(parseSeeds(input), ['brine.dev', 'worldof.brine.dev'])
})

test('parseSeeds: ignores comments', () => {
  const input = `
    # comment
    brine.dev
  `
  assert.deepEqual(parseSeeds(input), ['brine.dev'])
})

test('parseSeeds: deduplicates', () => {
  const input = `
    brine.dev
    brine.dev
  `
  assert.deepEqual(parseSeeds(input), ['brine.dev'])
})

test('parseSeeds: returns empty for empty input', () => {
  assert.deepEqual(parseSeeds(''), [])
})

test('seedToUrl: converts domain to identity url', () => {
  assert.equal(seedToUrl('brine.dev'), 'https://brine.dev/identity.json')
})
