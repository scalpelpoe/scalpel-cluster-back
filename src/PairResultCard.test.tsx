import { fireEvent, render, screen } from '@testing-library/react'
import { calculatePair, middlesOnBase } from './calculator'
import { PairResultCard } from './PairResultCard'

describe('PairResultCard', () => {
  it('shows the middles and one trade row per shared base for a valid pair', () => {
    const pair = calculatePair('Prodigious Defence', 'Feed the Fury')
    const onOpenTrade = vi.fn()
    render(<PairResultCard pair={pair} getLeague={() => 'Mercenaries'} onOpenTrade={onOpenTrade} />)
    expect(screen.getByText(/Prodigious Defence \(ilvl 1\) \+ Feed the Fury \(ilvl 50\)/)).toBeTruthy()
    expect(screen.getByText(/Smite the Weak \(1\)/)).toBeTruthy()
    expect(screen.getByText(/Heavy Hitter \(50\)/)).toBeTruthy()
    expect(screen.getByText(/Martial Prowess \(1\)/)).toBeTruthy()
    // 1 shared base -> exactly one trade button, no any-base row
    const buttons = screen.getAllByText('Open trade')
    expect(buttons).toHaveLength(1)
    fireEvent.click(buttons[0])
    expect(onOpenTrade).toHaveBeenCalledWith(expect.stringContaining('/trade/search/Mercenaries?q='))
  })

  it('adds the any-base row when more than one base is shared, and skips bases with no middles', () => {
    // Verified during planning: ok pair, 9 shared bases, middles Calamitous + Devastator.
    const pair = calculatePair('Fuel the Fight', 'Martial Prowess')
    if (!pair.ok) throw new Error(`expected ok pair, got ${pair.reason}`)
    render(<PairResultCard pair={pair} getLeague={() => 'Mercenaries'} onOpenTrade={() => {}} />)
    expect(screen.getByText('Any of these bases')).toBeTruthy()
    // Site parity: a base row only renders when at least one middle can roll on
    // that base (an empty count-group would match nothing on trade).
    const basesWithMiddles = pair.sharedBases.filter((b) => middlesOnBase(pair.middles, b).length > 0)
    expect(basesWithMiddles.length).toBeGreaterThan(0)
    expect(screen.getAllByText('Open trade').length).toBe(basesWithMiddles.length + 1)
  })

  it('renders the failure reason for an invalid pair', () => {
    const pair = calculatePair('Sadist', 'Prodigious Defence')
    render(<PairResultCard pair={pair} getLeague={() => 'Mercenaries'} onOpenTrade={() => {}} />)
    expect(screen.getByText(/cannot roll on any of the same cluster jewel bases/)).toBeTruthy()
  })
})
