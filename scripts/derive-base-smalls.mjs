// Derives scripts/vendor/base-small-icons.json: jewel-base option id -> that
// base's small-passive icon basename. Inputs: --raw <dir> holding the
// poe-dat-viewer exports PassiveSkills.json and Stats.json, plus the committed
// scripts/vendor/enchant-options.json (desc-set key -> option id, emitted by
// trim-data.mjs). Matching is exact stat-description-set equality,
// pre-validated during design: all 17 bases match exactly one small icon.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const outPath = resolve(root, 'scripts/vendor/base-small-icons.json')

function fail(msg) {
  console.error(`derive-base-smalls: ${msg}`)
  process.exit(1)
}

const rawFlag = process.argv.indexOf('--raw')
if (rawFlag === -1 || !process.argv[rawFlag + 1]) fail('usage: node scripts/derive-base-smalls.mjs --raw <dir with PassiveSkills.json + Stats.json>')
const rawDir = process.argv[rawFlag + 1]
const passives = JSON.parse(readFileSync(join(rawDir, 'PassiveSkills.json'), 'utf8'))
const stats = JSON.parse(readFileSync(join(rawDir, 'Stats.json'), 'utf8'))
const enchantOptions = JSON.parse(readFileSync(resolve(root, 'scripts/vendor/enchant-options.json'), 'utf8'))

const statId = new Map(stats.map((s) => [s._rid, s.Id]))
const smallIconsByKey = new Map()
for (const r of passives) {
  if (typeof r.Id !== 'string' || !r.Id.startsWith('affliction_')) continue
  if (r.IsNotable || r.IsJewelSocket || r.Id.startsWith('affliction_notable')) continue
  const key = r.Stats.map((rid) => statId.get(rid)).sort((a, b) => a.localeCompare(b)).join('|')
  if (!smallIconsByKey.has(key)) smallIconsByKey.set(key, new Set())
  smallIconsByKey.get(key).add(r.Icon_DDSFile)
}

const out = {}
for (const [descKey, optionId] of Object.entries(enchantOptions)) {
  const icons = smallIconsByKey.get(descKey)
  if (!icons || icons.size !== 1) fail(`base option ${optionId} ("${descKey}") matched ${icons ? icons.size : 0} small icons`)
  const base = [...icons][0].split('/').pop()?.replace(/\.dds$/, '')
  if (!base) fail(`unparseable icon path for option ${optionId}`)
  out[String(optionId)] = base
}
if (Object.keys(out).length !== 17) fail(`expected 17 bases, got ${Object.keys(out).length}`)
writeFileSync(outPath, `${JSON.stringify(Object.fromEntries(Object.entries(out).sort(([a], [b]) => Number(a) - Number(b))), null, 2)}\n`)
console.log(`derive-base-smalls: wrote ${outPath} (17 bases)`)
