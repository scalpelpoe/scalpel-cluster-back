import { fireEvent, render, screen } from '@testing-library/react'
import { calculatePair, middlesOnBase } from './calculator'
import { ResultsPanel } from './ResultsPanel'

describe('ResultsPanel', () => {
  it('lists middles vertically and one trade row per base with middles, plus any-base', () => {
    const pair = calculatePair('Fuel the Fight', 'Martial Prowess')
    if (!pair.ok) throw new Error(`expected ok pair, got ${pair.reason}`)
    const onOpenTrade = vi.fn()
    render(<ResultsPanel pair={pair} getLeague={() => 'Mercenaries'} onOpenTrade={onOpenTrade} />)
    expect(screen.getByText('Position 2 options')).toBeTruthy()
    expect(screen.getByText(/Calamitous \(ilvl/)).toBeTruthy()
    expect(screen.getByText(/Devastator \(ilvl/)).toBeTruthy()
    const basesWithMiddles = pair.sharedBases.filter((b) => middlesOnBase(pair.middles, b).length > 0)
    const buttons = screen.getAllByText('Open trade')
    expect(buttons).toHaveLength(basesWithMiddles.length + 1)
    fireEvent.click(buttons[0])
    expect(onOpenTrade).toHaveBeenCalledWith(expect.stringContaining('/trade/search/Mercenaries?q='))
  })

  it('renders the failure reason for an invalid pair', () => {
    const pair = calculatePair('Sadist', 'Prodigious Defence')
    render(<ResultsPanel pair={pair} getLeague={() => 'Mercenaries'} onOpenTrade={() => {}} />)
    expect(screen.getByText(/cannot roll on any of the same cluster jewel bases/)).toBeTruthy()
  })
})
