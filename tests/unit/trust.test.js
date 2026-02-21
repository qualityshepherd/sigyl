import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createTrustList, vouch, block, getStatus, VOUCH, BLOCK, STRANGER } from '../../src/trust.js'

test('new domain is a stranger', () => {
  const list = createTrustList()
  assert.equal(getStatus(list, 'example.com'), STRANGER)
})

test('vouch marks domain as vouched', () => {
  const list = createTrustList()
  const updated = vouch(list, 'example.com')
  assert.equal(getStatus(updated, 'example.com'), VOUCH)
})

test('block marks domain as blocked', () => {
  const list = createTrustList()
  const updated = block(list, 'example.com')
  assert.equal(getStatus(updated, 'example.com'), BLOCK)
})

test('vouch overwrites block', () => {
  const list = createTrustList()
  const updated = vouch(block(list, 'example.com'), 'example.com')
  assert.equal(getStatus(updated, 'example.com'), VOUCH)
})

test('block overwrites vouch', () => {
  const list = createTrustList()
  const updated = block(vouch(list, 'example.com'), 'example.com')
  assert.equal(getStatus(updated, 'example.com'), BLOCK)
})

test('does not mutate original list', () => {
  const list = createTrustList()
  vouch(list, 'example.com')
  assert.equal(getStatus(list, 'example.com'), STRANGER)
})
