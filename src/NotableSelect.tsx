import { RemoveButton } from '@scalpelpoe/plugin-sdk'
import { useState } from 'react'
import { compatibleWith } from './calculator'
import { getNotable } from './data'
import { NotableLabel } from './NotableLabel'
import { INPUT_BOX } from './ui'

const ROW_HEIGHT = 40
const VISIBLE_ROWS = 6

/** Autocomplete box for one desired notable. The option list is always
 *  visible at a fixed 6-row height (no layout shifting): unfiltered top
 *  options at rest, filtered while typing, and a quick-swap list while a
 *  value is chipped in the bar. Options are limited to notables compatible
 *  with the partner box's pick, so an invalid pair cannot be assembled. */
export function NotableSelect({ label, value, partner, onChange }: {
  label: string
  value: string | null
  partner: string | null
  onChange: (name: string | null) => void
}): JSX.Element {
  const [filter, setFilter] = useState('')
  const query = filter.trim().toLowerCase()
  const options = compatibleWith(partner ? [partner] : []).filter(
    (n) => n.name !== value && (query === '' || n.name.toLowerCase().includes(query)),
  )
  // With a partner chosen, tooltips list only the bases both notables share.
  const partnerBases = partner ? getNotable(partner)?.bases : undefined
  const sharedWith = (bases: number[] | undefined): number[] | undefined =>
    partnerBases && bases ? bases.filter((b) => partnerBases.includes(b)) : undefined

  function pickOption(name: string): void {
    setFilter('')
    onChange(name)
  }

  return (
    <div>
      <div className="section-title" style={{ marginBottom: 8 }}>{label}</div>
      {value ? (
        <div style={{ ...INPUT_BOX, display: 'flex', alignItems: 'center', gap: 6 }}>
          <NotableLabel name={value} size={26} tooltipBases={sharedWith(getNotable(value)?.bases)} />
          <span style={{ marginLeft: 'auto' }}>
            <RemoveButton onClick={() => onChange(null)} />
          </span>
        </div>
      ) : (
        <input
          type="text"
          placeholder="Search notables"
          value={filter}
          style={INPUT_BOX}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && options.length > 0) pickOption(options[0].name)
          }}
        />
      )}
      <ul
        style={{
          listStyle: 'none',
          margin: '4px 0 0',
          padding: 0,
          height: ROW_HEIGHT * VISIBLE_ROWS,
          overflowY: 'auto',
          background: 'rgba(0, 0, 0, 0.45)',
          borderRadius: 4,
          opacity: value ? 0.55 : 1,
        }}
      >
        {options.map((n) => (
          <li key={n.name}>
            <button
              type="button"
              onClick={() => pickOption(n.name)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text)',
                cursor: 'pointer',
                padding: '0 6px',
                width: '100%',
                textAlign: 'left',
                height: ROW_HEIGHT,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <NotableLabel name={n.name} size={26} tooltipBases={sharedWith(n.bases)} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
