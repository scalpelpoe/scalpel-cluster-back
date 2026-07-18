import raw from './data/cluster-data.json'

export interface NotableInfo {
  name: string
  rid: number
  group: string
  ilvl: number
  suffix: boolean
  tradeId: string
  bases: number[]
}

interface ClusterData {
  tradeStats: { addsPassives: string; grants: string }
  bases: Record<string, string>
  notables: Record<string, Omit<NotableInfo, 'name'>>
}

const data = raw as ClusterData

export const TRADE_STAT_ADDS_PASSIVES = data.tradeStats.addsPassives
export const TRADE_STAT_GRANTS = data.tradeStats.grants

// cluster-data.json is written with alphabetically sorted notable keys, so
// insertion order here is already the display order.
const byName = new Map<string, NotableInfo>(
  Object.entries(data.notables).map(([name, n]) => [name, { name, ...n }]),
)

export function allNotables(): NotableInfo[] {
  return [...byName.values()]
}

export function getNotable(name: string): NotableInfo | undefined {
  return byName.get(name)
}

export function baseText(baseId: number): string {
  return data.bases[String(baseId)] ?? `Unknown base ${baseId}`
}

export function allBaseIds(): number[] {
  return Object.keys(data.bases).map(Number).sort((a, b) => a - b)
}
