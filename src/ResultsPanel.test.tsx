import { fireEvent, render, screen } from '@testing-library/react'
import { calculatePair, middlesOnBase } from './calculator'
import { ResultsPanel } from './ResultsPanel'

describe('ResultsPanel', () => {
  it('multi-base pair: Any Base default shows all middles, one trade button, any-base query', () => {
    const pair = calculatePair('Fuel the Fight', 'Martial Prowess')
    if (!pair.ok) throw new Error(`expected ok pair, got ${pair.reason}`)
    const onOpenTrade = vi.fn()
    render(<ResultsPanel pair={pair} getLeague={() => 'Mercenaries'} onOpenTrade={onOpenTrade} />)
    expect(screen.getByText(`Back Notable Options (${pair.middles.length})`)).toBeTruthy()
    expect(screen.getByText('Cluster Base')).toBeTruthy()
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('any')
    expect(select.style.backgroundImage).toContain('svg+xml')
    expect(screen.getByText(/Calamitous \(ilvl/)).toBeTruthy()
    expect(screen.getByText(/Devastator \(ilvl/)).toBeTruthy()
    const list = screen.getByRole('list') as HTMLElement
    expect(list.style.height).toBe('72px')
    expect(list.style.overflowY).toBe('auto')
    const buttons = screen.getAllByText('Open trade')
    expect(buttons).toHaveLength(1)
    fireEvent.click(buttons[0])
    // any-base query carries no base enchant filter
    expect(onOpenTrade).toHaveBeenCalledWith(expect.not.stringContaining('3948993189'))
  })

  it('selecting a specific base filters the middles and scopes the trade query', () => {
    const pair = calculatePair('Fuel the Fight', 'Martial Prowess')
    if (!pair.ok) throw new Error('expected ok pair')
    const basesWithMiddles = pair.sharedBases.filter((b) => middlesOnBase(pair.middles, b).length > 0)
    const target = basesWithMiddles[0]
    const expected = middlesOnBase(pair.middles, target)
    const onOpenTrade = vi.fn()
    render(<ResultsPanel pair={pair} getLeague={() => 'Mercenaries'} onOpenTrade={onOpenTrade} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: String(target) } })
    for (const m of expected) expect(screen.getByText(new RegExp(`${m.name} \\(ilvl`))).toBeTruthy()
    const shown = screen.getAllByRole('listitem')
    expect(shown).toHaveLength(expected.length)
    expect(screen.getByText(`Back Notable Options (${expected.length})`)).toBeTruthy()
    fireEvent.click(screen.getByText('Open trade'))
    expect(onOpenTrade).toHaveBeenCalledWith(expect.stringContaining('3948993189'))
  })

  it('single-base pair: no Any Base option, the base is preselected', () => {
    const pair = calculatePair('Prodigious Defence', 'Feed the Fury')
    if (!pair.ok) throw new Error('expected ok pair')
    render(<ResultsPanel pair={pair} getLeague={() => 'Mercenaries'} onOpenTrade={() => {}} />)
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('8')
    expect(screen.queryByText('Any Base')).toBeNull()
    expect(screen.getByText('Shield - Attack Damage')).toBeTruthy()
  })

  it('renders the failure reason for an invalid pair', () => {
    const pair = calculatePair('Sadist', 'Prodigious Defence')
    render(<ResultsPanel pair={pair} getLeague={() => 'Mercenaries'} onOpenTrade={() => {}} />)
    expect(screen.getByText(/cannot roll on any of the same cluster jewel bases/)).toBeTruthy()
  })
})
