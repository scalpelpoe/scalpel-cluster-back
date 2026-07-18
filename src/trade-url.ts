import { middlesOnBase, type PairResult } from './calculator'
import { getNotable, TRADE_STAT_ADDS_PASSIVES, TRADE_STAT_GRANTS } from './data'

// Faithful port of the site's search shape: the and-group guarantees an
// 8-passive jewel with both desired notables; the count(min 1) group of
// possible middles guarantees the third notable sits in the skippable
// position 2 (anything not in that set fails the count and is excluded).

interface StatFilter {
  id: string
  value?: { min?: number; max?: number; option?: number }
}

export function tradeUrl(league: string, pair: PairResult, baseId: number | null): string {
  const and: StatFilter[] = [{ id: TRADE_STAT_ADDS_PASSIVES, value: { min: 8, max: 8 } }]
  if (baseId !== null) and.push({ id: TRADE_STAT_GRANTS, value: { option: baseId } })
  for (const name of [pair.name1, pair.name3]) {
    const info = getNotable(name)
    if (!info) throw new Error(`unknown notable: ${name}`)
    and.push({ id: info.tradeId })
  }
  const middles = baseId === null ? pair.middles : middlesOnBase(pair.middles, baseId)
  const body = {
    sort: { price: 'asc' },
    query: {
      status: { option: 'onlineleague' },
      stats: [
        { type: 'and', filters: and },
        { type: 'count', value: { min: 1 }, filters: middles.map((m) => ({ id: m.tradeId })) },
      ],
    },
  }
  return `https://www.pathofexile.com/trade/search/${encodeURIComponent(league)}?q=${encodeURIComponent(JSON.stringify(body))}`
}
