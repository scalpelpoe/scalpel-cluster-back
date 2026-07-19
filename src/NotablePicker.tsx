import { RemoveButton, TextInput } from '@scalpelpoe/plugin-sdk'
import { useState } from 'react'
import { compatibleWith } from './calculator'
import { allNotables } from './data'
import { NotableLabel } from './NotableLabel'

export function NotablePicker({ selected, onChange }: { selected: string[]; onChange: (selected: string[]) => void }): JSX.Element {
  const [filter, setFilter] = useState('')
  const query = filter.trim().toLowerCase()
  const compatible = compatibleWith(selected)
  const hiddenCount = allNotables().length - selected.length - compatible.length
  const addable = compatible.filter((n) => query === '' || n.name.toLowerCase().includes(query))

  return (
    <div>
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {selected.map((name) => (
            <span key={name} className="setting-box" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 6px' }}>
              <NotableLabel name={name} size={14} />
              <RemoveButton onClick={() => onChange(selected.filter((s) => s !== name))} />
            </span>
          ))}
        </div>
      )}
      <TextInput placeholder="Filter notables" value={filter} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilter(e.target.value)} />
      <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, maxHeight: 220, overflowY: 'auto' }}>
        {addable.map((n) => (
          <li key={n.name}>
            <button
              type="button"
              onClick={() => onChange([...selected, n.name])}
              style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '2px 4px', width: '100%', textAlign: 'left' }}
            >
              <NotableLabel name={n.name} />
            </button>
          </li>
        ))}
      </ul>
      {hiddenCount > 0 && (
        <div style={{ opacity: 0.6, marginTop: 4 }}>{hiddenCount} incompatible hidden</div>
      )}
    </div>
  )
}
