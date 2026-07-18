import { calculatePair } from './calculator'
import { tradeUrl } from './trade-url'

function decodeQuery(url: string): { path: string; body: unknown } {
  const u = new URL(url)
  return { path: u.pathname, body: JSON.parse(u.searchParams.get('q') ?? 'null') }
}

describe('tradeUrl', () => {
  const pair = calculatePair('Prodigious Defence', 'Feed the Fury')

  it('builds the per-base search: and-group pins 8 passives, base enchant, both desired ids; count-group holds the middles', () => {
    const { path, body } = decodeQuery(tradeUrl('Mercenaries', pair, 8))
    expect(path).toBe('/trade/search/Mercenaries')
    expect(body).toEqual({
      sort: { price: 'asc' },
      query: {
        status: { option: 'onlineleague' },
        stats: [
          {
            type: 'and',
            filters: [
              { id: 'enchant.stat_3086156145', value: { min: 8, max: 8 } },
              { id: 'enchant.stat_3948993189', value: { option: 8 } },
              { id: 'explicit.stat_1705633890' },
              { id: 'explicit.stat_3944525413' },
            ],
          },
          {
            type: 'count',
            value: { min: 1 },
            filters: [
              { id: 'explicit.stat_540300548' },
              { id: 'explicit.stat_3640252904' },
              { id: 'explicit.stat_1152182658' },
            ],
          },
        ],
      },
    })
  })

  it('omits the enchant filter and uses all middles for the any-base search', () => {
    const { body } = decodeQuery(tradeUrl('Mercenaries', pair, null))
    const stats = (body as { query: { stats: { type: string; filters: { id: string }[] }[] } }).query.stats
    expect(stats[0].filters.map((f) => f.id)).toEqual([
      'enchant.stat_3086156145',
      'explicit.stat_1705633890',
      'explicit.stat_3944525413',
    ])
    expect(stats[1].filters).toHaveLength(pair.middles.length)
  })

  it('URL-encodes the league segment', () => {
    const url = tradeUrl('Mercenaries HC', pair, 8)
    expect(url).toContain('/trade/search/Mercenaries%20HC?q=')
  })
})
