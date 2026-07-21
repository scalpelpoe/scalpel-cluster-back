# Notable Stat Tooltips Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hovering any notable name in the plugin shows its in-game stat lines in a tooltip.

**Architecture:** A vendor-time script downloads RePoE-fork stat translations and resolves each Large notable's stat ids/values (already present in `scripts/vendor/data-full.json`) into in-game text, committing only the ~15 KB result. `trim-data.mjs` joins those lines into `cluster-data.json` as `stats: string[]` per notable, and `NotableLabel` renders them in a custom hover tooltip. Spec: `docs/superpowers/specs/2026-07-21-notable-stat-tooltips-design.md`.

**Tech Stack:** Node ESM vendor scripts (global `fetch`, Node 18+), React 18 + TypeScript, vitest/jsdom with `@testing-library/react`.

## Global Constraints

- Runtime stays fully offline: network access only inside `scripts/fetch-*.mjs` vendor scripts, never in `src/` or at build time.
- `scripts/trim-data.mjs` stays deterministic and offline; `--check` must keep passing (it runs inside `src/data.test.ts`).
- Follow repo commit style: `feat: ...` one-liners.
- Vendor scripts report errors via the existing `fail()` convention: `console.error` + `process.exit(1)`; never write partial output.
- Test/typecheck commands: `npm test`, `npm run typecheck`.

**Fixture caveat:** the expected stat lines below were produced from repoe-fork data downloaded 2026-07-21. If Task 1's spot check shows different text (upstream league update), the upstream text wins — update the fixtures in this plan and in the tests to match, and re-verify the changed lines against poewiki.

---

### Task 1: Vendor script `fetch-notable-stats.mjs` + committed artifact

**Files:**
- Create: `scripts/fetch-notable-stats.mjs`
- Create (generated): `scripts/vendor/notable-stats.json`
- Modify: `README.md` (dev section, after the `trim-data` bullet)

**Interfaces:**
- Consumes: `scripts/vendor/data-full.json` — `full.Notables.Large` is `Record<notableName, { PassiveSkill: { Stats: Array<{ Description: { Description: string, Value: number } }> } }>` (107 entries).
- Produces: `scripts/vendor/notable-stats.json` — `Record<notableName, string[]>`, exactly the 107 Large notable names as keys, name-sorted (`localeCompare`), each value a non-empty array of in-game stat lines. Task 2 reads this file.

- [ ] **Step 1: Write the script**

Create `scripts/fetch-notable-stats.mjs`:

```js
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
```

- [ ] **Step 2: Run it**

Run: `node scripts/fetch-notable-stats.mjs`
Expected: `fetch-notable-stats: wrote <...>\scripts\vendor\notable-stats.json (107 notables)` and exit 0. Any `fail()` message means upstream data or the algorithm needs a look — do not commit partial output.

- [ ] **Step 3: Spot-check the artifact**

Run:

```bash
node -e "
const o = require('./scripts/vendor/notable-stats.json')
const assert = require('node:assert')
assert.strictEqual(Object.keys(o).length, 107)
assert.deepStrictEqual(o['Prodigious Defence'], [
  '+3% Chance to Block Attack Damage',
  '3% Chance to Block Spell Damage',
  '30% increased Attack Damage while holding a Shield',
])
assert.deepStrictEqual(o['Renewal'], [
  'Minions have 5% chance to deal Double Damage while they are on Full Life',
  'Minions Regenerate 1% of Life per second',
])
assert.deepStrictEqual(o['Weight Advantage'][0], '+20 to Strength')
assert.ok(o['Strike Leader'].includes('+0.2 metres to Melee Strike Range while Holding a Shield'))
assert.ok(o['Master the Fundamentals'].includes('35% reduced Elemental Damage'))
console.log('spot-check ok')
"
```

Expected: `spot-check ok`. (Mismatch = upstream league update; see the fixture caveat in Global Constraints.)

- [ ] **Step 4: Add the README dev bullet**

In `README.md`, after the `trim-data` bullet, add:

```markdown
- `node scripts/fetch-notable-stats.mjs` - regenerate
  `scripts/vendor/notable-stats.json` (in-game stat lines per notable, from
  RePoE-fork stat translations)
```

- [ ] **Step 5: Commit**

```bash
git add scripts/fetch-notable-stats.mjs scripts/vendor/notable-stats.json README.md
git commit -m "feat: vendor notable stat lines from RePoE-fork"
```

---

### Task 2: Join stats into cluster-data.json and expose via data.ts

**Files:**
- Modify: `scripts/trim-data.mjs`
- Modify: `src/data.ts`
- Modify: `src/data.test.ts`
- Regenerate: `src/data/cluster-data.json` (via `npm run trim-data`)

**Interfaces:**
- Consumes: `scripts/vendor/notable-stats.json` from Task 1 (`Record<notableName, string[]>`).
- Produces: `NotableInfo.stats: string[]` (non-empty, in-game lines) on every object returned by `allNotables()` / `getNotable(name)` in `src/data.ts`. Task 3 relies on `getNotable(name)?.stats`.

- [ ] **Step 1: Write the failing test**

In `src/data.test.ts`, add inside the `data accessors` describe block:

```ts
it('carries in-game stat lines for every notable', () => {
  for (const n of allNotables()) expect(n.stats.length).toBeGreaterThan(0)
  expect(getNotable('Prodigious Defence')?.stats).toEqual([
    '+3% Chance to Block Attack Damage',
    '3% Chance to Block Spell Damage',
    '30% increased Attack Damage while holding a Shield',
  ])
  expect(getNotable('Renewal')?.stats).toEqual([
    'Minions have 5% chance to deal Double Damage while they are on Full Life',
    'Minions Regenerate 1% of Life per second',
  ])
  expect(getNotable('Strike Leader')?.stats).toContain('+0.2 metres to Melee Strike Range while Holding a Shield')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data.test.ts`
Expected: FAIL — `TypeError: Cannot read properties of undefined (reading 'length')` (vitest strips types without checking, so the missing `stats` property fails at runtime).

- [ ] **Step 3: Join in trim-data.mjs**

In `scripts/trim-data.mjs`:

After the `enchantOptionsPath` const, add:

```js
const notableStatsPath = resolve(root, 'scripts/vendor/notable-stats.json')
```

After the `const full = JSON.parse(...)` line, add:

```js
const notableStats = JSON.parse(readFileSync(notableStatsPath, 'utf8'))
```

In the per-notable loop, replace:

```js
  notables[name] = {
    rid: n.Stat._rid,
    group: n.Mod.CorrectGroup,
    ilvl: n.Mod.Level,
    suffix: n.Mod.CorrectGroup.includes('Suffix'),
    tradeId,
    bases: [...new Set(baseIds)].sort((a, b) => a - b),
  }
```

with:

```js
  const stats = notableStats[name]
  if (!Array.isArray(stats) || stats.length === 0) fail(`no stat lines for notable "${name}" - run: node scripts/fetch-notable-stats.mjs`)
  notables[name] = {
    rid: n.Stat._rid,
    group: n.Mod.CorrectGroup,
    ilvl: n.Mod.Level,
    suffix: n.Mod.CorrectGroup.includes('Suffix'),
    tradeId,
    bases: [...new Set(baseIds)].sort((a, b) => a - b),
    stats,
  }
```

- [ ] **Step 4: Regenerate the runtime data**

Run: `npm run trim-data`
Expected: `trim-data: wrote <...>\src\data\cluster-data.json (107 notables, 17 bases)` and a diff on `src/data/cluster-data.json` adding a `stats` array to every notable.

- [ ] **Step 5: Add `stats` to the runtime type**

In `src/data.ts`, change `NotableInfo` to:

```ts
export interface NotableInfo {
  name: string
  rid: number
  group: string
  ilvl: number
  suffix: boolean
  tradeId: string
  bases: number[]
  stats: string[]
}
```

- [ ] **Step 6: Run tests and typecheck**

Run: `npm test`
Expected: PASS, including the `cluster-data.json sync` reproducibility test (it re-runs `trim-data --check` against the regenerated file).

Run: `npm run typecheck`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add scripts/trim-data.mjs src/data.ts src/data.test.ts src/data/cluster-data.json
git commit -m "feat: carry notable stat lines into cluster data"
```

---

### Task 3: Hover tooltip in NotableLabel

**Files:**
- Modify: `src/NotableLabel.tsx`
- Modify: `src/NotableLabel.test.tsx`

**Interfaces:**
- Consumes: `getNotable(name)?.stats` from `src/data.ts` (Task 2) and the existing `notableIcon(name)` from `src/icons.ts`.
- Produces: no new exports — `NotableLabel`'s props are unchanged (`{ name: string; detail?: string; size?: number }`), so no caller changes anywhere.

- [ ] **Step 1: Write the failing tests**

In `src/NotableLabel.test.tsx`, replace the whole file with:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { NotableLabel } from './NotableLabel'

const RENEWAL_LINE = 'Minions Regenerate 1% of Life per second'

describe('NotableLabel', () => {
  it('renders the icon and name for a known notable', () => {
    render(<NotableLabel name="Renewal" detail="(ilvl 1)" />)
    expect(screen.getByText(/Renewal \(ilvl 1\)/)).toBeTruthy()
    const img = document.querySelector('img')
    expect(img?.getAttribute('src')).toMatch(/^data:image\/png;base64,/)
  })

  it('degrades to text-only for unknown names', () => {
    render(<NotableLabel name="Total Fabrication" />)
    expect(screen.getByText('Total Fabrication')).toBeTruthy()
    expect(document.querySelector('img')).toBeNull()
  })

  it('shows the stat lines as a tooltip on hover and hides them on leave', () => {
    render(<NotableLabel name="Renewal" />)
    expect(screen.queryByText(RENEWAL_LINE)).toBeNull()
    fireEvent.mouseEnter(screen.getByText('Renewal'))
    expect(screen.getByText(RENEWAL_LINE)).toBeTruthy()
    expect(screen.getByText('Minions have 5% chance to deal Double Damage while they are on Full Life')).toBeTruthy()
    fireEvent.mouseLeave(screen.getByText('Renewal'))
    expect(screen.queryByText(RENEWAL_LINE)).toBeNull()
  })

  it('shows no tooltip for names without data', () => {
    render(<NotableLabel name="Total Fabrication" />)
    fireEvent.mouseEnter(screen.getByText('Total Fabrication'))
    expect(document.querySelector('[style*="fixed"]')).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `npx vitest run src/NotableLabel.test.tsx`
Expected: 2 PASS (existing), 1 FAIL — `Unable to find an element with the text: Minions Regenerate 1% of Life per second` — and the no-data test passing trivially. (If the no-data test also passes after implementation only by accident, the fixed-position selector assertion is the guard.)

- [ ] **Step 3: Implement the tooltip**

Replace `src/NotableLabel.tsx` with:

```tsx
import { useState, type MouseEvent } from 'react'
import { getNotable } from './data'
import { notableIcon } from './icons'

// Match the game's magic-mod blue for stat lines.
const MOD_BLUE = '#8888ff'
const LINE_HEIGHT = 16
const PAD_Y = 6
// jsdom and the overlay both report window dimensions; 6.5px/char at 12px
// font is a close-enough width estimate to keep the tooltip on screen.
const CHAR_WIDTH = 6.5

/** A notable's name with its passive icon (when known) and optional detail
 *  text like "(ilvl 50)". The single way notable names render in the UI.
 *  Hovering shows the notable's in-game stat lines in a fixed-position
 *  tooltip (viewport-clamped so scrolling option lists cannot clip it). */
export function NotableLabel({ name, detail, size = 16 }: { name: string; detail?: string; size?: number }): JSX.Element {
  const icon = notableIcon(name)
  const stats = getNotable(name)?.stats
  const [tip, setTip] = useState<{ left: number; top: number } | null>(null)

  function show(e: MouseEvent<HTMLSpanElement>): void {
    if (!stats) return
    const r = e.currentTarget.getBoundingClientRect()
    const width = Math.max(...stats.map((l) => l.length)) * CHAR_WIDTH + 20
    const height = stats.length * LINE_HEIGHT + PAD_Y * 2
    const below = r.bottom + 4
    setTip({
      left: Math.max(4, Math.min(r.left, window.innerWidth - width - 4)),
      top: below + height > window.innerHeight ? Math.max(4, r.top - height - 4) : below,
    })
  }

  return (
    <span
      onMouseEnter={show}
      onMouseLeave={() => setTip(null)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, verticalAlign: 'middle' }}
    >
      {icon && <img src={icon} alt="" draggable={false} style={{ width: size, height: size, flexShrink: 0 }} />}
      {detail ? `${name} ${detail}` : name}
      {tip && stats && (
        <span
          style={{
            position: 'fixed',
            left: tip.left,
            top: tip.top,
            zIndex: 1000,
            display: 'block',
            background: 'rgba(0, 0, 0, 0.92)',
            borderRadius: 4,
            padding: `${PAD_Y}px 10px`,
            pointerEvents: 'none',
          }}
        >
          {stats.map((line) => (
            <span
              key={line}
              style={{ display: 'block', color: MOD_BLUE, fontSize: 12, lineHeight: `${LINE_HEIGHT}px`, whiteSpace: 'nowrap' }}
            >
              {line}
            </span>
          ))}
        </span>
      )}
    </span>
  )
}
```

Implementation notes:
- The tooltip is a `<span display:block>` (not a `<div>`) because it nests inside the label's `<span>` — React warns on invalid div-in-span nesting.
- `pointerEvents: 'none'` keeps the tooltip from stealing the hover and flickering.
- `position: fixed` escapes the `overflowY: auto` option lists; no ancestor in this plugin has a CSS transform, so fixed positioning is viewport-relative everywhere it renders.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/NotableLabel.test.tsx`
Expected: 4 PASS.

- [ ] **Step 5: Full suite, typecheck, build**

Run: `npm test`
Expected: PASS (all files).

Run: `npm run typecheck`
Expected: exit 0.

Run: `npm run build`
Expected: exit 0, `dist/plugin.js` and `dist/manifest.json` emitted.

- [ ] **Step 6: Commit**

```bash
git add src/NotableLabel.tsx src/NotableLabel.test.tsx
git commit -m "feat: notable stat tooltips on hover"
```
