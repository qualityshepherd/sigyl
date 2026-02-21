import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mergeSeedLists, fetchRemoteSeeds } from '../../src/federation.js'

test('mergeSeedLists: merges two lists', () => {
  const local = ['https://alice.com/identity.json']
  const remote = ['https://bob.org/identity.json']
  const merged = mergeSeedLists(local, remote)
  assert.equal(merged.length, 2)
})

test('mergeSeedLists: deduplicates', () => {
  const local = ['https://alice.com/identity.json']
  const remote = ['https://alice.com/identity.json']
  assert.equal(mergeSeedLists(local, remote).length, 1)
})

test('mergeSeedLists: filters invalid urls from remote', () => {
  const local = ['https://alice.com/identity.json']
  const remote = ['not-a-url', 'http://insecure.com/identity.json']
  assert.equal(mergeSeedLists(local, remote).length, 1)
})

test('mergeSeedLists: handles empty lists', () => {
  assert.deepEqual(mergeSeedLists([], []), [])
})

test('fetchRemoteSeeds: returns empty on bad response', async () => {
  const badFetcher = async () => ({ not: 'seeds' })
  const result = await fetchRemoteSeeds('https://example.com/seeds.json', badFetcher)
  assert.deepEqual(result, [])
})

test('fetchRemoteSeeds: returns seeds array on good response', async () => {
  const goodFetcher = async () => ({ seeds: ['https://alice.com/identity.json'] })
  const result = await fetchRemoteSeeds('https://example.com/seeds.json', goodFetcher)
  assert.deepEqual(result, ['https://alice.com/identity.json'])
})
