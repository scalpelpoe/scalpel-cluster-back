import { Button } from '@scalpelpoe/plugin-sdk'
import { middlesOnBase, type PairResult } from './calculator'
import { baseText } from './data'
import { NotableLabel } from './NotableLabel'
import { tradeUrl } from './trade-url'
import { PANEL_BOX } from './ui'

const FAILURE_TEXT: Record<string, string> = {
  'same-group': 'These notables share a mod group and cannot roll together.',
  'no-shared-base': 'These notables cannot roll on any of the same cluster jewel bases.',
  'no-middles': 'No notable can appear in position 2 with this pair.',
}

/** Single-pair results, strictly vertical: middles list, then stacked trade
 *  rows. */
export function ResultsPanel({ pair, getLeague, onOpenTrade }: {
  pair: PairResult
  getLeague: () => string
  onOpenTrade: (url: string) => void
}): JSX.Element {
  if (!pair.ok) {
    return (
      <div style={{ ...PANEL_BOX, padding: 10 }}>
        {FAILURE_TEXT[pair.reason ?? 'no-middles']}
      </div>
    )
  }
  const basesWithMiddles = pair.sharedBases.filter((b) => middlesOnBase(pair.middles, b).length > 0)
  return (
    <div style={{ ...PANEL_BOX, padding: 10 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Position 2 options</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
        {pair.middles.map((m) => (
          <NotableLabel key={m.name} name={m.name} detail={`(ilvl ${m.ilvl})`} />
        ))}
      </div>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Trade searches</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {basesWithMiddles.map((baseId) => (
          <div key={baseId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1, whiteSpace: 'pre-line' }}>{baseText(baseId)}</span>
            <Button onClick={() => onOpenTrade(tradeUrl(getLeague(), pair, baseId))}>Open trade</Button>
          </div>
        ))}
        {pair.sharedBases.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1 }}>Any of these bases</span>
            <Button onClick={() => onOpenTrade(tradeUrl(getLeague(), pair, null))}>Open trade</Button>
          </div>
        )}
      </div>
    </div>
  )
}
