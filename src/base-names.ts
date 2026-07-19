import { baseText } from './data'

/** Curated short display names for the 17 Large Cluster Jewel bases, keyed by
 *  trade option id (stable GGG ids). Full text stays available via
 *  baseText() for tooltips. User-reviewed list - edit here if any are off. */
const BASE_SHORT_NAMES: Record<number, string> = {
  1: 'Axe/Sword - Hits & Ailments',
  2: 'Staff/Mace - Hits & Ailments',
  3: 'Claw/Dagger - Hits & Ailments',
  4: 'Bows - Damage/DoT',
  5: 'Wands - Hits & Ailments',
  6: 'Two Handed - Damage',
  7: 'Dual Wielding - Attack Damage',
  8: 'Shield - Attack Damage',
  9: 'Attack Damage',
  10: 'Spell Damage',
  11: 'Elemental Damage',
  12: 'Physical Damage',
  13: 'Fire Damage',
  14: 'Lightning Damage',
  15: 'Cold Damage',
  16: 'Chaos Damage',
  17: 'Minion Damage',
}

export function baseShortName(baseId: number): string {
  return BASE_SHORT_NAMES[baseId] ?? baseText(baseId)
}
