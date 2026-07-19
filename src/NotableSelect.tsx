import { RemoveButton, TextInput } from '@scalpelpoe/plugin-sdk'
import { useState } from 'react'
import { compatibleWith } from './calculator'
import { NotableLabel } from './NotableLabel'

/** Autocomplete box for one desired notable. Options are limited to notables
 *  compatible with the partner box's pick, so an invalid pair cannot be
 *  assembled. Type-to-search; Enter picks the first match. */
export function NotableSelect({ label, value, partner, onChange }: {
  label: string
  value: string | null
  partner: string | null
  onChange: (name: string | null) => void
}): JSX.Element {
  const [filter, setFilter] = useState('')
  const query = filter.trim().toLowerCase()
  const options = query === '' ? [] : compatibleWith(partner ? [partner] : []).filter((n) => n.name.toLowerCase().includes(query))

  function pickOption(name: string): void {
    setFilter('')
    onChange(name)
  }

  return (
    <div>
      <div className="section-title">{label}</div>
      {value ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <NotableLabel name={value} />
          <RemoveButton onClick={() => onChange(null)} />
        </div>
      ) : (
        <>
          <TextInput
            placeholder="Search notables"
            value={filter}
            fullWidth
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilter(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter' && options.length > 0) pickOption(options[0].name)
            }}
          />
          {options.length > 0 && (
            <ul style={{ listStyle: 'none', margin: '4px 0 0', padding: 0, maxHeight: 200, overflowY: 'auto' }}>
              {options.map((n) => (
                <li key={n.name}>
                  <button
                    type="button"
                    onClick={() => pickOption(n.name)}
                    style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '2px 4px', width: '100%', textAlign: 'left' }}
                  >
                    <NotableLabel name={n.name} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
