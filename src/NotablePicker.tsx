import { RemoveButton, TextInput } from '@scalpelpoe/plugin-sdk'
import { useState } from 'react'
import { allNotables } from './data'

export function NotablePicker({ selected, onChange }: { selected: string[]; onChange: (selected: string[]) => void }): JSX.Element {
  const [filter, setFilter] = useState('')
  const query = filter.trim().toLowerCase()
  const addable = allNotables().filter((n) => !selected.includes(n.name) && (query === '' || n.name.toLowerCase().includes(query)))

  return (
    <div>
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {selected.map((name) => (
            <span key={name} className="setting-box" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 6px' }}>
              {name}
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
              {n.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
