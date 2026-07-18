// Manual parity probe: prints middle-notable sets for representative pairs.
// Compare against the live site before any release. Run: node scripts/verify-parity.mjs
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const data = JSON.parse(readFileSync(resolve(root, 'src/data/cluster-data.json'), 'utf8'))
const notables = Object.entries(data.notables).map(([name, n]) => ({ name, ...n }))
const byName = new Map(notables.map((n) => [n.name, n]))

function pair(name1, name3) {
  const n1 = byName.get(name1)
  const n3 = byName.get(name3)
  if (!n1 || !n3) throw new Error(`unknown notable: ${name1} / ${name3}`)
  if (n1.group === n3.group) return { error: 'same group' }
  const shared = n1.bases.filter((b) => n3.bases.includes(b))
  if (!shared.length) return { error: 'no shared base' }
  const lo = Math.min(n1.rid, n3.rid)
  const hi = Math.max(n1.rid, n3.rid)
  const pairPrefixes = (n1.suffix ? 0 : 1) + (n3.suffix ? 0 : 1)
  const middles = notables
    .filter((n2) => n2.rid > lo && n2.rid < hi && pairPrefixes + (n2.suffix ? 0 : 1) < 3
      && n2.bases.some((b) => shared.includes(b)) && n2.group !== n1.group && n2.group !== n3.group)
    .sort((a, b) => a.rid - b.rid)
  if (!middles.length) return { error: 'no middles' }
  return { middles: middles.map((m) => `${m.name} (${m.ilvl})`), bases: shared.map((b) => data.bases[String(b)].split('\n')[0]) }
}

const CASES = [
  ['Prodigious Defence', 'Feed the Fury'],
  ['Sadist', 'Prodigious Defence'],
  ['Snowstorm', 'Blanketed Snow'],
  ['Corrosive Elements', 'Doryani\'s Lesson'],
  ['Fuel the Fight', 'Martial Prowess'],
  ['Renewal', 'Call to the Slaughter'],
]
for (const [a, b] of CASES) {
  console.log(`\n=== ${a} + ${b} ===`)
  console.log(JSON.stringify(pair(a, b), null, 2))
}
