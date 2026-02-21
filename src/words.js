import { createHash } from 'crypto'

const WORDS = [
  'wolf', 'table', 'seven', 'rain', 'stone', 'ember', 'north', 'glass',
  'river', 'smoke', 'salt', 'iron', 'crow', 'amber', 'frost', 'lantern',
  'tide', 'cedar', 'flint', 'marsh', 'hollow', 'peak', 'wren', 'cobalt',
  'dusk', 'raven', 'chalk', 'forge', 'vale', 'sparrow', 'ash', 'copper',
  'ridge', 'gale', 'moss', 'horn', 'fern', 'slate', 'birch', 'anchor',
  'thorn', 'heron', 'drift', 'crag', 'veil', 'ember', 'wick', 'spire',
  'bay', 'bluff', 'brook', 'burr', 'cairn', 'cleft', 'coil', 'crest',
  'dell', 'drew', 'dune', 'fell', 'fen', 'ford', 'glade', 'glen'
]

export function publicKeyToWords (key) {
  const hash = createHash('sha256').update(key).digest('hex')

  return [0, 8, 16, 24]
    .map(offset => parseInt(hash.slice(offset, offset + 8), 16) % WORDS.length)
    .map(index => WORDS[index])
    .join(' ')
}
