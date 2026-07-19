import type { PoeItem } from '@scalpelpoe/plugin-sdk'
import { allBaseIds, baseText, getNotable, type NotableInfo } from './data'

const NOTABLE_RE = /^1 Added Passive Skill is (.+)$/
const PASSIVES_RE = /^Adds (\d+) Passive Skills?$/
const GRANT_RE = /^Added Small Passive Skills grant: (.+)$/

export interface CopiedJewelAnalysis {
  passives: number | null
  baseId: number | null
  recognized: NotableInfo[]
  unknown: string[]
}

export function analyzeClusterItem(item: PoeItem): CopiedJewelAnalysis | null {
  // Local check rather than the SDK's isClusterJewel: that helper requires
  // baseType to end with "Cluster Jewel", which a magic affix suffix
  // ("... of the Order") breaks. includes() tolerates the affix remnants.
  if (item.itemClass !== 'Jewels' || !item.baseType.includes('Large Cluster Jewel')) return null

  const recognized: NotableInfo[] = []
  const unknown: string[] = []
  for (const line of item.explicits) {
    const m = NOTABLE_RE.exec(line)
    if (!m) continue
    const info = getNotable(m[1])
    if (info) recognized.push(info)
    else unknown.push(m[1])
  }
  recognized.sort((a, b) => a.rid - b.rid)

  let passives: number | null = null
  for (const line of item.enchants) {
    const m = PASSIVES_RE.exec(line)
    if (m) passives = Number(m[1])
  }

  const grants: string[] = []
  for (const line of item.enchants) {
    const g = GRANT_RE.exec(line)
    if (g) grants.push(g[1])
  }
  let baseId: number | null = null
  if (grants.length > 0) {
    const wanted = [...grants].sort((a, b) => a.localeCompare(b)).join('\n')
    for (const id of allBaseIds()) {
      const lines = baseText(id).split('\n').sort((a, b) => a.localeCompare(b)).join('\n')
      if (lines === wanted) {
        baseId = id
        break
      }
    }
  }
  return { passives, baseId, recognized, unknown }
}
