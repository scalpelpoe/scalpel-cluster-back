import { Button } from '@scalpelpoe/plugin-sdk'
import { middlesOnBase, type PairResult } from './calculator'
import { baseText, getNotable, type NotableInfo } from './data'
import { tradeUrl } from './trade-url'

const FAILURE_TEXT: Record<string, string> = {
  'same-group': 'These notables share a mod group and cannot roll together.',
  'no-shared-base': 'These notables cannot roll on any of the same cluster jewel bases.',
  'no-middles': 'No notable can appear in position 2 with this pair.',
}

function middleList(middles: NotableInfo[]): string {
  return middles.map((m) => `${m.name} (${m.ilvl})`).join(', ')
}

export function PairResultCard({ pair, getLeague, onOpenTrade }: {
  pair: PairResult
  getLeague: () => string
  onOpenTrade: (url: string) => void
}): JSX.Element {
  const ilvl1 = getNotable(pair.name1)?.ilvl ?? 0
  const ilvl3 = getNotable(pair.name3)?.ilvl ?? 0
  // Site parity: only render a base row when at least one middle can roll on
  // that base - a trade query with an empty count-group would match nothing.
  const basesWithMiddles = pair.sharedBases.filter((b) => middlesOnBase(pair.middles, b).length > 0)
  return (
    <div className="setting-box" style={{ padding: 8, marginBottom: 8 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>
        {pair.name1} (ilvl {ilvl1}) + {pair.name3} (ilvl {ilvl3})
      </div>
      {!pair.ok ? (
        <div style={{ opacity: 0.8 }}>{FAILURE_TEXT[pair.reason ?? 'no-middles']}</div>
      ) : (
        <>
          <div style={{ marginBottom: 6 }}>
            Position 2 options: {middleList(pair.middles)}
          </div>
          {basesWithMiddles.map((baseId) => (
            <div key={baseId} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
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
          <div style={{ opacity: 0.7, marginTop: 4 }}>Jewel ilvl range: {pair.minIlvl} - {pair.maxIlvl}</div>
        </>
      )}
    </div>
  )
}
