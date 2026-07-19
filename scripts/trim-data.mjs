// Regenerates src/data/cluster-data.json from scripts/vendor/data-full.json
// (a byte-for-byte copy of the upstream site's data.json). Run: npm run trim-data
// With --check: regenerate in memory and fail (exit 1) if the committed file drifts.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const fullPath = resolve(root, 'scripts/vendor/data-full.json')
const outPath = resolve(root, 'src/data/cluster-data.json')
const enchantOptionsPath = resolve(root, 'scripts/vendor/enchant-options.json')

const full = JSON.parse(readFileSync(fullPath, 'utf8'))
const large = full.Notables.Large
const grantStat = full.TradeStats.Enchant['Added Small Passive Skills grant: #']
const addsStat = full.TradeStats.Enchant['Adds # Passive Skills']
const grantOptions = grantStat.option.options

function fail(msg) {
  console.error(`trim-data: ${msg}`)
  process.exit(1)
}

// --- enchant -> trade option resolution (ported from the site's Calculator.js) ---
function harvestKeywords(lineDescr) {
  return lineDescr
    .replace('+', 'increased_')
    .replace('physical_damage_reduction_rating', 'armour')
    .replace('channelled', 'channel')
    .replace('suppression', 'suppress')
    .replace('sigil', 'brand')
    .replace('empowered', 'exert')
    .toLowerCase()
    .split('_')
    .filter((w) => !['%', 'and', 'a', 'base', 'damage', 'to', 'rating', 'additional'].includes(w))
}

function resolveOption(enchantment) {
  let opts = [...grantOptions]
  for (let i = 0; i < enchantment.length; i++) {
    const line = enchantment[i]
    const keywords = harvestKeywords(line.Description)
    opts = opts.filter((opt) => {
      const text = opt.text.toLowerCase()
      if (!text.includes(line.Value)) return false
      for (const k of keywords) if (!text.includes(k)) return false
      if (text.includes('legacy')) return false
      if (text.startsWith('minion') && !keywords.includes('minion')) return false
      if (text.includes('herald') && !keywords.includes('herald')) return false
      if (text.includes('time') && !keywords.includes('time')) {
        let found = false
        for (let l = 0; l < enchantment.length; l++) {
          if (l === i) continue
          if (harvestKeywords(enchantment[l].Description).includes('time')) found = true
        }
        if (!found) return false
      }
      return true
    })
    if (opts.length === 1) return opts[0]
  }
  return null
}

const enchantKey = (ench) => ench.map((l) => l.Description.replace('%', `${l.Value}%`)).join('/')

// --- build the trimmed structure ---
const optionByKey = new Map()
const bases = {}
const notables = {}
const enchantOptions = {}

for (const name of Object.keys(large).sort((a, b) => a.localeCompare(b))) {
  const n = large[name]
  const tradeId = full.TradeStats.Explicit[name]
  if (!tradeId) fail(`no trade id for notable "${name}"`)
  const baseIds = []
  for (const ench of n.Enchantments) {
    const key = enchantKey(ench)
    if (!optionByKey.has(key)) {
      const opt = resolveOption(ench)
      if (!opt) fail(`enchant did not resolve to a trade option: ${key} (notable "${name}")`)
      for (const [k, o] of optionByKey) {
        if (o.id === opt.id && k !== key) fail(`two enchants resolved to option ${opt.id}: "${k}" vs "${key}"`)
      }
      optionByKey.set(key, opt)
      bases[opt.id] = opt.text
      enchantOptions[ench.map((l) => l.Description).sort((a, b) => a.localeCompare(b)).join('|')] = opt.id
    }
    baseIds.push(optionByKey.get(key).id)
  }
  notables[name] = {
    rid: n.Stat._rid,
    group: n.Mod.CorrectGroup,
    ilvl: n.Mod.Level,
    suffix: n.Mod.CorrectGroup.includes('Suffix'),
    tradeId,
    bases: [...new Set(baseIds)].sort((a, b) => a - b),
  }
}

const rids = Object.values(notables).map((n) => n.rid)
if (new Set(rids).size !== rids.length) fail('duplicate stat rid across notables')

const trimmed = {
  tradeStats: { addsPassives: addsStat.id, grants: grantStat.id },
  bases: Object.fromEntries(Object.entries(bases).sort(([a], [b]) => Number(a) - Number(b))),
  notables,
}
const json = `${JSON.stringify(trimmed, null, 2)}\n`
const enchantJson = `${JSON.stringify(Object.fromEntries(Object.entries(enchantOptions).sort(([a], [b]) => a.localeCompare(b))), null, 2)}\n`

if (process.argv.includes('--check')) {
  const committed = readFileSync(outPath, 'utf8')
  if (committed !== json) fail('src/data/cluster-data.json is out of sync - run: npm run trim-data')
  const committedEnchant = readFileSync(enchantOptionsPath, 'utf8')
  if (committedEnchant !== enchantJson) fail('scripts/vendor/enchant-options.json is out of sync - run: npm run trim-data')
  console.log(`trim-data: in sync (${Object.keys(notables).length} notables, ${Object.keys(bases).length} bases)`)
} else {
  writeFileSync(outPath, json)
  console.log(`trim-data: wrote ${outPath} (${Object.keys(notables).length} notables, ${Object.keys(bases).length} bases)`)
  writeFileSync(enchantOptionsPath, enchantJson)
  console.log(`trim-data: wrote ${enchantOptionsPath} (${Object.keys(enchantOptions).length} entries)`)
}
