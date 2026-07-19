import { allBaseIds, baseText } from './data'
import { baseShortName } from './base-names'

describe('baseShortName', () => {
  it('covers every jewel base', () => {
    for (const id of allBaseIds()) {
      const short = baseShortName(id)
      expect(short, `base ${id}`).toBeTruthy()
      expect(short.length, `base ${id}`).toBeLessThan(30)
      expect(short).not.toBe(baseText(id))
    }
  })

  it('matches the curated examples', () => {
    expect(baseShortName(1)).toBe('Axe/Sword - Hits & Ailments')
    expect(baseShortName(4)).toBe('Bows - Damage/DoT')
    expect(baseShortName(8)).toBe('Shield - Attack Damage')
  })

  it('is keyed against the expected base texts', () => {
    expect(baseText(1)).toMatch(/^Axe Attacks/)
    expect(baseText(4)).toMatch(/Bows/)
    expect(baseText(8)).toMatch(/Shield/)
    expect(baseText(17)).toMatch(/^Minions/)
  })
})
