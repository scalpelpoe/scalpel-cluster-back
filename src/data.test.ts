import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { allBaseIds, allNotables, baseText, getNotable, TRADE_STAT_ADDS_PASSIVES, TRADE_STAT_GRANTS } from './data'

describe('cluster-data.json sync', () => {
  it('is reproducible from the vendored full dataset', () => {
    // Throws (nonzero exit) if src/data/cluster-data.json drifts from the transform output.
    execFileSync('node', [resolve(__dirname, '../scripts/trim-data.mjs'), '--check'])
  })
})

describe('data accessors', () => {
  it('exposes all 107 Large notables alphabetically', () => {
    const all = allNotables()
    expect(all).toHaveLength(107)
    const names = all.map((n) => n.name)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
  })

  it('carries verified values for Prodigious Defence', () => {
    const n = getNotable('Prodigious Defence')
    expect(n).toMatchObject({
      rid: 11118,
      ilvl: 1,
      suffix: false,
      tradeId: 'explicit.stat_1705633890',
      bases: [8],
    })
  })

  it('marks the shared-group suffix notables', () => {
    expect(getNotable('Smite the Weak')).toMatchObject({ rid: 11214, suffix: true, tradeId: 'explicit.stat_540300548' })
    expect(getNotable('Heavy Hitter')).toMatchObject({ rid: 11215, ilvl: 50, suffix: true })
    expect(getNotable('Force Multiplier')?.group).toBe(getNotable('Furious Assault')?.group)
  })

  it('resolves the 17 jewel bases with human text', () => {
    expect(allBaseIds()).toHaveLength(17)
    expect(baseText(8)).toBe('12% increased Attack Damage while holding a Shield')
    expect(baseText(1)).toBe('Axe Attacks deal 12% increased Damage with Hits and Ailments\nSword Attacks deal 12% increased Damage with Hits and Ailments')
  })

  it('exposes the trade stat ids', () => {
    expect(TRADE_STAT_ADDS_PASSIVES).toBe('enchant.stat_3086156145')
    expect(TRADE_STAT_GRANTS).toBe('enchant.stat_3948993189')
  })

  it('gives every notable a distinct rid and at least one base', () => {
    const all = allNotables()
    expect(new Set(all.map((n) => n.rid)).size).toBe(all.length)
    for (const n of all) expect(n.bases.length).toBeGreaterThan(0)
  })
})
