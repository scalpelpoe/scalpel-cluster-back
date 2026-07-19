import { RemoveButton, TextInput } from '@scalpelpoe/plugin-sdk'
import { useState } from 'react'
import { compatibleWith } from './calculator'
import { NotableLabel } from './NotableLabel'
import { PANEL_BOX } from './ui'

const ROW_HEIGHT = 24
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

  function pickOption(name: string): void {
    setFilter('')
    onChange(name)
  }

  return (
    <div>
      <div className="section-title">{label}</div>
      {value ? (
        <div style={{ ...PANEL_BOX, display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px', minHeight: 26 }}>
          <NotableLabel name={value} />
          <span style={{ marginLeft: 'auto' }}>
            <RemoveButton onClick={() => onChange(null)} />
          </span>
        </div>
      ) : (
        <TextInput
          placeholder="Search notables"
          value={filter}
          fullWidth
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilter(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && options.length > 0) pickOption(options[0].name)
          }}
        />
      )}
      <ul style={{ listStyle: 'none', margin: '4px 0 0', padding: 0, height: ROW_HEIGHT * VISIBLE_ROWS, overflowY: 'auto' }}>
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
                padding: '0 4px',
                width: '100%',
                textAlign: 'left',
                height: ROW_HEIGHT,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <NotableLabel name={n.name} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
