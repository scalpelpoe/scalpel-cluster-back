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

/** Shared min-height for the results panel and its empty-state placeholder so
 *  swapping between them never shifts the layout below. */
export const RESULTS_MIN_HEIGHT = 120

/** House input chrome, matching Scalpel's own inputs (regex base picker,
 *  hotkey field): solid app-dark fill, no stroke, 40px-tall rounded box. */
export const INPUT_BOX: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  minHeight: 40,
  padding: '8px 12px',
  backgroundColor: 'var(--bg-solid, #171821)',
  border: 'none',
  outline: 'none',
  borderRadius: 4,
  color: 'var(--text)',
}
