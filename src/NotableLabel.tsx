import { useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { baseShortName } from './base-names'
import { getNotable } from './data'
import { notableIcon } from './icons'

// Match the game's magic-mod blue for stat lines; house muted tone for the
// bases section so it reads as secondary to the stats.
const MOD_BLUE = '#8888ff'
const MUTED = '#9e9480'
const LINE_HEIGHT = 16
const PAD_Y = 6
// jsdom and the overlay both report window dimensions; 6.5px/char at 12px
// font is a close-enough width estimate to keep the tooltip on screen.
const CHAR_WIDTH = 6.5
const BASES_HEADER = 'Possible Bases:'

/** A notable's name with its passive icon (when known) and optional detail
 *  text like "(ilvl 50)". The single way notable names render in the UI.
 *  Hovering shows the notable's in-game stat lines plus the cluster bases it
 *  can roll on - all of its bases by default, or just `tooltipBases` when the
 *  caller has narrower context (bases shared with a chosen partner/pair).
 *
 *  The tooltip portals to document.body: the Scalpel overlay positions
 *  itself with a CSS transform (translate + optional scale), and a
 *  transformed ancestor becomes the containing block for position:fixed
 *  descendants - rendered in place, the tooltip lands offset by the
 *  overlay's translation. Same approach as the host's own HoverTooltip,
 *  including recovering the overlay scale from rect.width / offsetWidth. */
export function NotableLabel({ name, detail, size = 16, tooltipBases }: {
  name: string
  detail?: string
  size?: number
  tooltipBases?: number[]
}): JSX.Element {
  const icon = notableIcon(name)
  const info = getNotable(name)
  const stats = info?.stats
  const bases = tooltipBases ?? info?.bases ?? []
  const baseNames = bases.map(baseShortName)
  const [tip, setTip] = useState<{ left: number; top: number; scale: number } | null>(null)

  function show(e: MouseEvent<HTMLSpanElement>): void {
    if (!stats?.length) return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const scale = el.offsetWidth > 0 ? r.width / el.offsetWidth : 1
    const lines = [...stats, ...(baseNames.length > 0 ? [BASES_HEADER, ...baseNames] : [])]
    const width = (Math.max(...lines.map((l) => l.length)) * CHAR_WIDTH + 20) * scale
    const height = (lines.length * LINE_HEIGHT + PAD_Y * 2) * scale
    const below = r.bottom + 4
    setTip({
      left: Math.max(4, Math.min(r.left, window.innerWidth - width - 4)),
      top: below + height > window.innerHeight ? Math.max(4, r.top - height - 4) : below,
      scale,
    })
  }

  const lineStyle = { fontSize: 12, lineHeight: `${LINE_HEIGHT}px`, whiteSpace: 'nowrap' } as const

  return (
    <span
      onMouseEnter={show}
      onMouseLeave={() => setTip(null)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, verticalAlign: 'middle' }}
    >
      {icon && <img src={icon} alt="" draggable={false} style={{ width: size, height: size, flexShrink: 0 }} />}
      {detail ? `${name} ${detail}` : name}
      {tip && stats &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              left: tip.left,
              top: tip.top,
              zIndex: 1000,
              transform: `scale(${tip.scale})`,
              transformOrigin: 'top left',
              background: 'rgba(0, 0, 0, 0.92)',
              borderRadius: 4,
              padding: `${PAD_Y}px 10px`,
              pointerEvents: 'none',
            }}
          >
            {stats.map((line, i) => (
              <div key={i} style={{ ...lineStyle, color: MOD_BLUE }}>
                {line}
              </div>
            ))}
            {baseNames.length > 0 && (
              <>
                {/* Match the host's .section-title look: bold accent gold. */}
                <div style={{ ...lineStyle, color: 'var(--accent, #c8a96e)', fontWeight: 700, marginTop: 6 }}>{BASES_HEADER}</div>
                {baseNames.map((base) => (
                  <div key={base} style={{ ...lineStyle, color: MUTED }}>
                    {base}
                  </div>
                ))}
              </>
            )}
          </div>,
          document.body,
        )}
    </span>
  )
}
