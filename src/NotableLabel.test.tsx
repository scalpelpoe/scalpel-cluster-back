import { render, screen } from '@testing-library/react'
import { NotableLabel } from './NotableLabel'

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
})
