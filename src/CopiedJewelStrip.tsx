import { Button } from '@scalpelpoe/plugin-sdk'
import type { CopiedJewelAnalysis } from './clipboard'
import { NotableLabel } from './NotableLabel'

/** Compact strip for the last copied Large Cluster Jewel: front pair, the
 *  skippable back notable when present, and a Load pair action. Renders
 *  nothing below 2 recognized notables. */
export function CopiedJewelStrip({ analysis, onLoad }: {
  analysis: CopiedJewelAnalysis
  onLoad: (pair: [string, string]) => void
}): JSX.Element | null {
  const { recognized } = analysis
  if (recognized.length < 2) return null
  const first = recognized[0]
  const last = recognized[recognized.length - 1]
  const back = recognized.length >= 3 ? recognized[1] : null
  return (
    <div className="setting-box" style={{ padding: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ opacity: 0.8 }}>Copied jewel:</span>
      <NotableLabel name={first.name} />
      <span>+</span>
      <NotableLabel name={last.name} />
      {back && (
        <span style={{ opacity: 0.7, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          (back: <NotableLabel name={back.name} size={14} /> - skippable)
        </span>
      )}
      <Button onClick={() => onLoad([first.name, last.name])}>Load pair</Button>
    </div>
  )
}
