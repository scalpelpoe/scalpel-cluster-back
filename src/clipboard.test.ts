import { defaultPoeItem, type PoeItem } from '@scalpelpoe/plugin-sdk'
import { analyzeClusterItem } from './clipboard'

function jewel(overrides: Record<string, unknown>): PoeItem {
  return defaultPoeItem({ itemClass: 'Jewels', baseType: 'Large Cluster Jewel', ...overrides }) as unknown as PoeItem
}

describe('analyzeClusterItem', () => {
  it('orders a 3-notable jewel by rid: position 2 is the middle', () => {
    const a = analyzeClusterItem(
      jewel({
        enchants: ['Adds 8 Passive Skills', 'Added Small Passive Skills grant: 12% increased Attack Damage while holding a Shield'],
        explicits: [
          '1 Added Passive Skill is Feed the Fury',
          '1 Added Passive Skill is Smite the Weak',
          '1 Added Passive Skill is Prodigious Defence',
          'Added Small Passive Skills have 3% increased effect',
        ],
      }),
    )
    expect(a).not.toBeNull()
    expect(a?.passives).toBe(8)
    // rids: Prodigious Defence 11118 < Smite the Weak 11214 < Feed the Fury 11221
    expect(a?.recognized.map((n) => n.name)).toEqual(['Prodigious Defence', 'Smite the Weak', 'Feed the Fury'])
    expect(a?.unknown).toEqual([])
  })

  it('collects unknown notable names instead of dropping them', () => {
    const a = analyzeClusterItem(
      jewel({ explicits: ['1 Added Passive Skill is Total Fabrication', '1 Added Passive Skill is Heavy Hitter'] }),
    )
    expect(a?.recognized.map((n) => n.name)).toEqual(['Heavy Hitter'])
    expect(a?.unknown).toEqual(['Total Fabrication'])
  })

  it('returns null for non-cluster items and small/medium clusters', () => {
    expect(analyzeClusterItem(defaultPoeItem({ itemClass: 'Jewels', baseType: 'Cobalt Jewel' }) as unknown as PoeItem)).toBeNull()
    expect(analyzeClusterItem(jewel({ baseType: 'Medium Cluster Jewel' }))).toBeNull()
  })

  it('accepts a magic-item baseType with affix remnants', () => {
    const a = analyzeClusterItem(jewel({ baseType: 'Buzzing Large Cluster Jewel of the Order', explicits: ['1 Added Passive Skill is Heavy Hitter'] }))
    expect(a?.recognized.map((n) => n.name)).toEqual(['Heavy Hitter'])
  })

  it('handles a jewel with no notables and no passives enchant', () => {
    const a = analyzeClusterItem(jewel({}))
    expect(a).toEqual({ passives: null, baseId: null, recognized: [], unknown: [] })
  })

  it('detects the jewel base from a single-line grant enchant', () => {
    const a = analyzeClusterItem(
      jewel({ enchants: ['Adds 8 Passive Skills', 'Added Small Passive Skills grant: 12% increased Attack Damage while holding a Shield'] }),
    )
    expect(a?.baseId).toBe(8)
  })

  it('detects a two-line base regardless of line order', () => {
    const a = analyzeClusterItem(
      jewel({
        enchants: [
          'Added Small Passive Skills grant: Sword Attacks deal 12% increased Damage with Hits and Ailments',
          'Added Small Passive Skills grant: Axe Attacks deal 12% increased Damage with Hits and Ailments',
        ],
      }),
    )
    expect(a?.baseId).toBe(1)
  })

  it('returns null baseId for unknown or missing grant text', () => {
    expect(analyzeClusterItem(jewel({ enchants: ['Added Small Passive Skills grant: something new'] }))?.baseId).toBeNull()
    expect(analyzeClusterItem(jewel({}))?.baseId).toBeNull()
  })
})
