// Vendors the in-game stat lines for Large cluster jewel notables. Run:
//   node scripts/fetch-notable-stats.mjs
// Downloads RePoE-fork stat translations (network is vendor-time only; the
// build and runtime never fetch), translates each Large notable's stats from
// scripts/vendor/data-full.json, and writes scripts/vendor/notable-stats.json
// (notable name -> in-game lines, name-sorted). Entries from the
// passive_skill translation file are preferred over the generic file: they
// carry the passive-context wording the game shows on jewels (and attribute
// stats like base_strength only exist there).
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const fullPath = resolve(root, 'scripts/vendor/data-full.json')
const outPath = resolve(root, 'scripts/vendor/notable-stats.json')

const MAIN_URL = 'https://repoe-fork.github.io/stat_translations.json'
const PASSIVE_URL = 'https://repoe-fork.github.io/stat_translations/passive_skill.json'

function fail(msg) {
  console.error(`fetch-notable-stats: ${msg}`)
  process.exit(1)
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'scalpel-cluster-back stat vendor (github.com/scalpelpoe)' } })
  if (res.status !== 200) fail(`${res.status} for ${url}`)
  return res.json()
}

// The only index handlers the current dataset needs. Anything new fails hard
// so a future data refresh cannot silently ship a wrong line.
const HANDLERS = {
  negate: (v) => -v,
  divide_by_one_hundred: (v) => v / 100,
  per_minute_to_per_second: (v) => Math.round((v / 60) * 10) / 10,
  locations_to_metres: (v) => v / 10,
}

function indexById(entries) {
  const m = new Map()
  for (const e of entries) {
    for (const id of e.ids) {
      if (!m.has(id)) m.set(id, [])
      m.get(id).push(e)
    }
  }
  return m
}

const condMatches = (c, v) =>
  !c || (!c.negated && (c.min == null || v >= c.min) && (c.max == null || v <= c.max))

function translateEntry(entry, values, ctx) {
  const branch = entry.English.find((t) =>
    entry.ids.every((_, i) => condMatches(t.condition[i], values[i])))
  if (!branch) fail(`no matching condition branch for [${entry.ids.join(', ')}] (${ctx})`)
  let s = branch.string
  for (let i = 0; i < entry.ids.length; i++) {
    const fmt = branch.format[i]
    if (fmt === 'ignore') continue
    let v = values[i]
    for (const h of branch.index_handlers[i] ?? []) {
      if (!(h in HANDLERS)) fail(`unknown index handler "${h}" (${ctx})`)
      v = HANDLERS[h](v)
    }
    if (fmt !== '#' && fmt !== '+#') fail(`unknown format "${fmt}" (${ctx})`)
    const rendered = fmt === '+#' && v >= 0 ? `+${v}` : String(v)
    s = s.replaceAll(`{${i}}`, rendered)
  }
  if (s.includes('{')) fail(`unsubstituted placeholder in "${s}" (${ctx})`)
  return s
}

const full = JSON.parse(readFileSync(fullPath, 'utf8'))
const [main, passive] = await Promise.all([fetchJson(MAIN_URL), fetchJson(PASSIVE_URL)])
const byIdMain = indexById(main)
const byIdPassive = indexById(passive)
const candidatesFor = (id) => byIdPassive.get(id) ?? byIdMain.get(id)

function translateNotable(name, stats) {
  const remaining = new Map(stats.map((s) => [s.Description.Description, s.Description.Value]))
  const lines = []
  while (remaining.size > 0) {
    const [id] = remaining.keys()
    const cands = candidatesFor(id)
    if (!cands) fail(`no translation entry for stat "${id}" (${name})`)
    // Multi-stat lines: prefer the entry covering the most of this
    // notable's remaining ids; ids the notable lacks contribute value 0.
    let best = null
    let bestCover = 0
    for (const e of cands) {
      const cover = e.ids.filter((i) => remaining.has(i)).length
      if (cover > bestCover) {
        best = e
        bestCover = cover
      }
    }
    const values = best.ids.map((i) => remaining.get(i) ?? 0)
    lines.push(translateEntry(best, values, name))
    for (const i of best.ids) remaining.delete(i)
  }
  return lines
}

const out = {}
for (const name of Object.keys(full.Notables.Large).sort((a, b) => a.localeCompare(b))) {
  const lines = translateNotable(name, full.Notables.Large[name].PassiveSkill.Stats)
  if (lines.length === 0) fail(`no stat lines for notable "${name}"`)
  out[name] = lines
}
writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`)
console.log(`fetch-notable-stats: wrote ${outPath} (${Object.keys(out).length} notables)`)
