import { Button } from '@scalpelpoe/plugin-sdk'
import { baseShortName } from './base-names'
import { middlesOnBase, type PairResult } from './calculator'
import { baseText } from './data'
import { NotableLabel } from './NotableLabel'
import { tradeUrl } from './trade-url'
import { INPUT_BOX, PANEL_BOX, RESULTS_MIN_HEIGHT } from './ui'

const FAILURE_TEXT: Record<string, string> = {
  'same-group': 'These notables share a mod group and cannot roll together.',
  'no-shared-base': 'These notables cannot roll on any of the same cluster jewel bases.',
  'no-middles': 'No notable can appear in position 2 with this pair.',
}

/** Two-column results: the possible back (position 2) notables on the left,
 *  the cluster-base dropdown plus the trade action on the right. The base
 *  choice filters the list and scopes the trade search; "Any Base" exists
 *  only when more than one base can actually produce a middle. */
export function ResultsPanel({ pair, choice, onChoiceChange, getLeague, onOpenTrade }: {
  pair: PairResult
  choice: string
  onChoiceChange: (choice: string) => void
  getLeague: () => string
  onOpenTrade: (url: string) => void
}): JSX.Element {
  const basesWithMiddles = pair.sharedBases.filter((b) => middlesOnBase(pair.middles, b).length > 0)
  const hasAny = basesWithMiddles.length > 1

  if (!pair.ok) {
    return <div style={{ ...PANEL_BOX, padding: 10, minHeight: RESULTS_MIN_HEIGHT }}>{FAILURE_TEXT[pair.reason ?? 'no-middles']}</div>
  }

  const value = hasAny ? choice : String(basesWithMiddles[0] ?? '')
  const baseId = value === 'any' ? null : Number(value)
  const shownMiddles = baseId === null ? pair.middles : middlesOnBase(pair.middles, baseId)

  return (
    <div style={{ ...PANEL_BOX, padding: 10, minHeight: RESULTS_MIN_HEIGHT }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div className="section-title">Back Notable Options ({shownMiddles.length})</div>
          <ul style={{ listStyle: 'none', margin: '4px 0 0', padding: 0, height: 72, overflowY: 'auto' }}>
            {shownMiddles.map((m) => (
              <li key={m.name} style={{ height: 24, display: 'flex', alignItems: 'center' }}>
                <NotableLabel name={m.name} detail={`(ilvl ${m.ilvl})`} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="section-title">Cluster Base</div>
          <select
            value={value}
            onChange={(e) => onChoiceChange(e.target.value)}
            style={{
              ...INPUT_BOX,
              marginTop: 4,
              appearance: 'none',
              WebkitAppearance: 'none',
              paddingRight: 28,
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239e9480' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
            }}
          >
            {hasAny && <option value="any">Any Base</option>}
            {basesWithMiddles.map((id) => (
              <option key={id} value={String(id)} title={baseText(id)}>
                {baseShortName(id)}
              </option>
            ))}
          </select>
          <div style={{ marginTop: 8 }}>
            <Button onClick={() => onOpenTrade(tradeUrl(getLeague(), pair, baseId))}>Find on Trade Site</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
