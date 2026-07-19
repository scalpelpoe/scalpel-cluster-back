import { getNotable } from './data'
import { calculateAll, calculatePair, compatibleWith, middlesOnBase } from './calculator'

describe('calculatePair', () => {
  it('finds the middle notables for Prodigious Defence + Feed the Fury', () => {
    const r = calculatePair('Prodigious Defence', 'Feed the Fury')
    expect(r.ok).toBe(true)
    // Only shared base is the shield jewel (option 8): PD rolls nowhere else.
    expect(r.sharedBases).toEqual([8])
    // rid-ascending: Smite the Weak 11214, Heavy Hitter 11215, Martial Prowess 11216
    expect(r.middles.map((m) => m.name)).toEqual(['Smite the Weak', 'Heavy Hitter', 'Martial Prowess'])
    // PD ilvl 1, FtF ilvl 50, middles 1/50/1
    expect(r.minIlvl).toBe(1)
    expect(r.maxIlvl).toBe(50)
  })

  it('is symmetric in argument order', () => {
    const a = calculatePair('Prodigious Defence', 'Feed the Fury')
    const b = calculatePair('Feed the Fury', 'Prodigious Defence')
    expect(b.middles.map((m) => m.name)).toEqual(a.middles.map((m) => m.name))
    expect(b.sharedBases).toEqual(a.sharedBases)
  })

  it('rejects two notables in the same mod group', () => {
    // Both are suffix notables; all suffix notables share one group.
    const r = calculatePair('Force Multiplier', 'Furious Assault')
    expect(r).toMatchObject({ ok: false, reason: 'same-group', middles: [] })
  })

  it('rejects notables with no shared jewel base', () => {
    // Sadist rolls on ele/fire/cold/lightning bases, Prodigious Defence only on shield.
    const r = calculatePair('Sadist', 'Prodigious Defence')
    expect(r).toMatchObject({ ok: false, reason: 'no-shared-base' })
  })

  it('rejects pairs with no possible middle notable', () => {
    // The site README's own impossible-pair example.
    const r = calculatePair('Snowstorm', 'Blanketed Snow')
    expect(r).toMatchObject({ ok: false, reason: 'no-middles' })
  })

  it('never allows three prefixes: a prefix pair only yields suffix middles', () => {
    const r = calculatePair('Prodigious Defence', 'Feed the Fury')
    for (const m of r.middles) expect(m.suffix).toBe(true)
  })

  it('throws on an unknown notable name', () => {
    expect(() => calculatePair('Nonsense', 'Feed the Fury')).toThrow(/unknown notable/i)
  })
})

describe('middlesOnBase', () => {
  it('filters middles to those rollable on the given base', () => {
    const r = calculatePair('Prodigious Defence', 'Feed the Fury')
    const onShield = middlesOnBase(r.middles, 8)
    expect(onShield.length).toBeGreaterThan(0)
    for (const m of onShield) expect(m.bases).toContain(8)
  })
})

describe('calculateAll', () => {
  it('produces one result per unordered pair, in selection order', () => {
    const results = calculateAll(['Prodigious Defence', 'Feed the Fury', 'Sadist'])
    expect(results.map((r) => [r.name1, r.name3])).toEqual([
      ['Prodigious Defence', 'Feed the Fury'],
      ['Prodigious Defence', 'Sadist'],
      ['Feed the Fury', 'Sadist'],
    ])
  })
})

describe('compatibleWith', () => {
  it('returns every notable when nothing is selected', () => {
    expect(compatibleWith([])).toHaveLength(107)
  })

  it('excludes the selection itself and anything forming an invalid pair', () => {
    const names = compatibleWith(['Prodigious Defence']).map((n) => n.name)
    expect(names).not.toContain('Prodigious Defence')
    // Sadist shares no jewel base with Prodigious Defence.
    expect(names).not.toContain('Sadist')
    expect(names).toContain('Feed the Fury')
  })

  it('excludes all other suffix notables once a suffix is selected', () => {
    const names = compatibleWith(['Smite the Weak']).map((n) => n.name)
    expect(names.length).toBeGreaterThan(0)
    expect(names.every((name) => !getNotable(name)?.suffix)).toBe(true)
  })

  it('keeps the whole selection pairwise valid for every candidate', () => {
    const candidates = compatibleWith(['Prodigious Defence', 'Feed the Fury'])
    expect(candidates.length).toBeGreaterThan(0)
    for (const c of candidates) {
      expect(calculatePair('Prodigious Defence', c.name).ok).toBe(true)
      expect(calculatePair('Feed the Fury', c.name).ok).toBe(true)
    }
  })
})
