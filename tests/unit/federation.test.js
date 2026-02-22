import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mergeSeedLists, fetchRemoteSeeds } from '../../src/federation.js'

test('mergeSeedLists: merges two lists', () => {
  const local = ['brine.dev']
  const remote = ['bob.org']
  assert.equal(mergeSeedLists(local, remote).length, 2)
})

test('mergeSeedLists: deduplicates', () => {
  const local = ['brine.dev']
  const remote = ['brine.dev']
  assert.equal(mergeSeedLists(local, remote).length, 1)
})

test('mergeSeedLists: filters invalid domains from remote', () => {
  const local = ['brine.dev']
  const remote = ['not-valid', 'https://brine.dev']
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

test('fetchRemoteSeeds: returns seeds on good response', async () => {
  const goodFetcher = async () => ({ seeds: ['brine.dev'] })
  const result = await fetchRemoteSeeds('https://example.com/seeds.json', goodFetcher)
  assert.deepEqual(result, ['brine.dev'])
})
