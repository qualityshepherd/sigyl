import { test } from 'node:test'
import assert from 'node:assert/strict'
import { publicKeyToWords } from '../../src/words.js'

test('returns four words', () => {
  assert.equal(publicKeyToWords('abc123').split(' ').length, 4)
})

test('is deterministic', () => {
  assert.equal(publicKeyToWords('abc123'), publicKeyToWords('abc123'))
})

test('different keys produce different words', () => {
  assert.notEqual(publicKeyToWords('abc123'), publicKeyToWords('def456'))
})

test('works with long keys', () => {
  assert.equal(publicKeyToWords('a'.repeat(256)).split(' ').length, 4)
})

test('returns only lowercase words', () => {
  const result = publicKeyToWords('abc123')
  assert.equal(result, result.toLowerCase())
})
