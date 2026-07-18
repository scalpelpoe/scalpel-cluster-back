import { allNotables, getNotable, type NotableInfo } from './data'

export type PairFailure = 'same-group' | 'no-shared-base' | 'no-middles'

export interface PairResult {
  name1: string
  name3: string
  ok: boolean
  reason?: PairFailure
  sharedBases: number[]
  middles: NotableInfo[]
  minIlvl: number
  maxIlvl: number
}

export function calculatePair(name1: string, name3: string): PairResult {
  const n1 = getNotable(name1)
  const n3 = getNotable(name3)
  if (!n1 || !n3) throw new Error(`unknown notable: ${!n1 ? name1 : name3}`)
  const fail = (reason: PairFailure): PairResult => ({
    name1, name3, ok: false, reason, sharedBases: [], middles: [], minIlvl: 0, maxIlvl: 0,
  })

  if (n1.group === n3.group) return fail('same-group')

  const sharedBases = n1.bases.filter((b) => n3.bases.includes(b))
  if (sharedBases.length === 0) return fail('no-shared-base')

  // Position ordering is by stat rid: lowest rolls position 1, highest position
  // 3, so a "skippable middle" candidate must sit strictly between the pair.
  const lo = Math.min(n1.rid, n3.rid)
  const hi = Math.max(n1.rid, n3.rid)
  // Items allow at most 2 prefixes, so the trio may contain at most 2.
  const pairPrefixes = (n1.suffix ? 0 : 1) + (n3.suffix ? 0 : 1)

  const middles = allNotables()
    .filter(
      (n2) =>
        n2.rid > lo &&
        n2.rid < hi &&
        pairPrefixes + (n2.suffix ? 0 : 1) < 3 &&
        n2.bases.some((b) => sharedBases.includes(b)) &&
        n2.group !== n1.group &&
        n2.group !== n3.group,
    )
    .sort((a, b) => a.rid - b.rid)
  if (middles.length === 0) return fail('no-middles')

  const ilvls = [n1.ilvl, n3.ilvl, ...middles.map((m) => m.ilvl)]
  return {
    name1, name3, ok: true, sharedBases, middles,
    minIlvl: Math.min(...ilvls), maxIlvl: Math.max(...ilvls),
  }
}

export function middlesOnBase(middles: NotableInfo[], baseId: number): NotableInfo[] {
  return middles.filter((m) => m.bases.includes(baseId))
}

export function calculateAll(selected: string[]): PairResult[] {
  const out: PairResult[] = []
  for (let i = 0; i < selected.length; i++) {
    for (let j = i + 1; j < selected.length; j++) out.push(calculatePair(selected[i], selected[j]))
  }
  return out
}
