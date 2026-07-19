import type { CSSProperties } from 'react'

/** Panel-container visuals matching Scalpel's .setting-box (dark bg, radius)
 *  WITHOUT the class itself: in the host stylesheet .setting-box is a
 *  horizontal settings-row (flex items-center justify-between cursor-pointer),
 *  which silently turned our stacked panels into side-by-side columns in the
 *  real overlay. jsdom tests never load host CSS, so never borrow host
 *  layout classes - carry layout inline. */
export const PANEL_BOX: CSSProperties = {
  background: 'rgba(0, 0, 0, 0.3)',
  borderRadius: 4,
}
