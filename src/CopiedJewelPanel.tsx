import { Button } from '@scalpelpoe/plugin-sdk'
import type { CopiedJewelAnalysis } from './clipboard'

export function CopiedJewelPanel({ analysis, onLoadPair }: {
  analysis: CopiedJewelAnalysis
  onLoadPair: (names: [string, string]) => void
}): JSX.Element {
  const { recognized, unknown, passives } = analysis
  const three = recognized.length >= 3
  return (
    <div className="setting-box" style={{ padding: 8, marginBottom: 10 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>
        Copied jewel{passives != null ? ` (${passives} passives)` : ''}
      </div>
      <ol style={{ margin: '0 0 6px', padding: 0, listStyle: 'none' }}>
        {recognized.map((n, i) => (
          <li key={n.name}>
            {i + 1}. {n.name} (ilvl {n.ilvl})
            {three && i === 1 ? ' - middle, skippable' : ''}
          </li>
        ))}
      </ol>
      {recognized.length === 2 && <div style={{ opacity: 0.8, marginBottom: 6 }}>Middle position open.</div>}
      {unknown.length > 0 && (
        <div style={{ opacity: 0.8, marginBottom: 6 }}>Unrecognized: {unknown.join(', ')}</div>
      )}
      {recognized.length >= 2 && (
        <Button onClick={() => onLoadPair([recognized[0].name, recognized[recognized.length - 1].name])}>
          Load pair into calculator
        </Button>
      )}
    </div>
  )
}
