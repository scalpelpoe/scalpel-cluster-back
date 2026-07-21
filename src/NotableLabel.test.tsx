import { fireEvent, render, screen } from '@testing-library/react'
import { NotableLabel } from './NotableLabel'

const RENEWAL_LINE = 'Minions Regenerate 1% of Life per second'

describe('NotableLabel', () => {
  it('renders the icon and name for a known notable', () => {
    render(<NotableLabel name="Renewal" detail="(ilvl 1)" />)
    expect(screen.getByText(/Renewal \(ilvl 1\)/)).toBeTruthy()
    const img = document.querySelector('img')
    expect(img?.getAttribute('src')).toMatch(/^data:image\/png;base64,/)
  })

  it('degrades to text-only for unknown names', () => {
    render(<NotableLabel name="Total Fabrication" />)
    expect(screen.getByText('Total Fabrication')).toBeTruthy()
    expect(document.querySelector('img')).toBeNull()
  })

  it('shows the stat lines as a tooltip on hover and hides them on leave', () => {
    render(<NotableLabel name="Renewal" />)
    expect(screen.queryByText(RENEWAL_LINE)).toBeNull()
    fireEvent.mouseEnter(screen.getByText('Renewal'))
    expect(screen.getByText(RENEWAL_LINE)).toBeTruthy()
    expect(screen.getByText('Minions have 5% chance to deal Double Damage while they are on Full Life')).toBeTruthy()
    fireEvent.mouseLeave(screen.getByText('Renewal'))
    expect(screen.queryByText(RENEWAL_LINE)).toBeNull()
  })

  it('portals the tooltip to document.body so overlay transforms cannot offset it', () => {
    // The Scalpel overlay positions itself with a CSS transform, which makes
    // any in-place position:fixed descendant resolve against the transformed
    // ancestor instead of the viewport. The tooltip must render under
    // document.body, outside the label's own subtree.
    render(<NotableLabel name="Renewal" />)
    fireEvent.mouseEnter(screen.getByText('Renewal'))
    const tooltip = screen.getByText(RENEWAL_LINE).parentElement
    expect(tooltip?.parentElement).toBe(document.body)
    expect(screen.getByText('Renewal').contains(tooltip)).toBe(false)
  })

  it('shows no tooltip for names without data', () => {
    render(<NotableLabel name="Total Fabrication" />)
    fireEvent.mouseEnter(screen.getByText('Total Fabrication'))
    expect(document.querySelector('[style*="fixed"]')).toBeNull()
  })

  it('lists the notable bases under Possible Bases by default', () => {
    render(<NotableLabel name="Renewal" />)
    fireEvent.mouseEnter(screen.getByText('Renewal'))
    const header = screen.getByText('Possible Bases:') as HTMLElement
    expect(header.style.fontWeight).toBe('700')
    expect(header.style.color).toBe('var(--accent, #c8a96e)')
    expect(screen.getByText('Minion Damage')).toBeTruthy()
  })

  it('limits the listed bases to tooltipBases when given', () => {
    render(<NotableLabel name="Feed the Fury" tooltipBases={[8]} />)
    fireEvent.mouseEnter(screen.getByText('Feed the Fury'))
    expect(screen.getByText('Possible Bases:')).toBeTruthy()
    expect(screen.getByText('Shield - Attack Damage')).toBeTruthy()
    expect(screen.queryByText('Axe/Sword - Hits & Ailments')).toBeNull()
  })
})
