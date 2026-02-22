import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateIndex } from '../../src/index.js'

const identities = [
  { public_key: 'abc123', mirror: 'https://sigyl.org', domain: 'alice.com' },
  { public_key: 'def456', mirror: 'https://sigyl.org', domain: 'bob.org' }
]

test('generates valid html', () => {
  const html = generateIndex(identities, 'sigyl.org')
  assert.ok(html.includes('<!DOCTYPE html>'))
})

test('includes mirror domain', () => {
  const html = generateIndex(identities, 'sigyl.org')
  assert.ok(html.includes('sigyl.org'))
})

test('includes each vouched domain', () => {
  const html = generateIndex(identities, 'sigyl.org')
  assert.ok(html.includes('alice.com'))
  assert.ok(html.includes('bob.org'))
})

test('includes rel=me links', () => {
  const html = generateIndex(identities, 'sigyl.org')
  assert.ok(html.includes('rel="me"'))
})

test('empty identities shows empty message', () => {
  const html = generateIndex([], 'sigyl.org')
  assert.ok(html.includes('no vouched identities yet'))
})
