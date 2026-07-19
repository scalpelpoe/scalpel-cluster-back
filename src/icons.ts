import raw from './data/notable-icons.json'

interface NotableIcons {
  byNotable: Record<string, string>
  baseSmalls: Record<string, string>
  icons: Record<string, string>
}

const data = raw as NotableIcons

/** 32x32 PNG data URI for a notable's passive icon, or null for names the
 *  bundled dataset does not know (future league drift degrades to text). */
export function notableIcon(name: string): string | null {
  const base = data.byNotable[name]
  return base ? (data.icons[base] ?? null) : null
}

/** 32x32 PNG data URI for a jewel base's small-passive node art, or null for
 *  unknown base ids. */
export function baseSmallIcon(baseId: number): string | null {
  const base = data.baseSmalls[String(baseId)]
  return base ? (data.icons[base] ?? null) : null
}
