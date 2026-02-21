import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateIndex } from '../../src/index.js'

const vouchedIdentities = [
  { public_key: 'abc123', domain: 'alice.com' },
  { public_key: 'def456', domain: 'bob.org' }
]

test('generates valid html', () => {
  const html = generateIndex(vouchedIdentities, 'mymirror.org')
  assert.ok(html.includes('<!DOCTYPE html>'))
})

test('includes mirror domain', () => {
  const html = generateIndex(vouchedIdentities, 'mymirror.org')
  assert.ok(html.includes('mymirror.org'))
})

test('includes each vouched domain', () => {
  const html = generateIndex(vouchedIdentities, 'mymirror.org')
  assert.ok(html.includes('alice.com'))
  assert.ok(html.includes('bob.org'))
})

test('includes rel=me links', () => {
  const html = generateIndex(vouchedIdentities, 'mymirror.org')
  assert.ok(html.includes('rel="me"'))
  assert.ok(html.includes('https://alice.com'))
  assert.ok(html.includes('https://bob.org'))
})

test('includes fingerprints', () => {
  const html = generateIndex(vouchedIdentities, 'mymirror.org')
  // four words per identity
  const words = html.match(/[a-z]+ [a-z]+ [a-z]+ [a-z]+/g)
  assert.ok(words && words.length >= 2)
})

test('empty identities renders empty list', () => {
  const html = generateIndex([], 'mymirror.org')
  assert.ok(html.includes('<!DOCTYPE html>'))
  assert.ok(!html.includes('alice.com'))
})
