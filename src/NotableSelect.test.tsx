import { fireEvent, render, screen } from '@testing-library/react'
import { NotableSelect } from './NotableSelect'

describe('NotableSelect', () => {
  it('always shows the option list, 6 rows tall, alphabetical from the top', () => {
    const { container } = render(<NotableSelect label="Desired Notable 1" value={null} partner={null} onChange={() => {}} />)
    const list = container.querySelector('ul')
    expect(list).toBeTruthy()
    expect(list?.style.height).toBe('144px')
    const rows = screen.getAllByRole('listitem')
    expect(rows.length).toBe(107)
    expect(rows[0].textContent).toContain('Advance Guard')
  })

  it('filters options by typed text and picks on click', () => {
    const onChange = vi.fn()
    render(<NotableSelect label="Desired Notable 1" value={null} partner={null} onChange={onChange} />)
    fireEvent.change(screen.getByPlaceholderText('Search notables'), { target: { value: 'prodig' } })
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    fireEvent.click(screen.getByText('Prodigious Defence'))
    expect(onChange).toHaveBeenCalledWith('Prodigious Defence')
  })

  it('picks the first match on Enter', () => {
    const onChange = vi.fn()
    render(<NotableSelect label="Desired Notable 1" value={null} partner={null} onChange={onChange} />)
    const input = screen.getByPlaceholderText('Search notables')
    fireEvent.change(input, { target: { value: 'feed the' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('Feed the Fury')
  })

  it('limits options to notables compatible with the partner', () => {
    render(<NotableSelect label="Desired Notable 2" value={null} partner="Prodigious Defence" onChange={() => {}} />)
    expect(screen.queryByText('Sadist')).toBeNull()
    expect(screen.getByText('Feed the Fury')).toBeTruthy()
  })

  it('renders the pick as a chip in the bar frame and keeps the swap list below', () => {
    const onChange = vi.fn()
    render(<NotableSelect label="Desired Notable 1" value="Prodigious Defence" partner={null} onChange={onChange} />)
    // chip present exactly once (not repeated in the list), input gone, list still there
    expect(screen.getAllByText('Prodigious Defence')).toHaveLength(1)
    expect(screen.queryByPlaceholderText('Search notables')).toBeNull()
    expect(screen.getAllByRole('listitem').length).toBe(106)
    // clicking a list option swaps the pick
    fireEvent.click(screen.getByText('Feed the Fury'))
    expect(onChange).toHaveBeenCalledWith('Feed the Fury')
  })

  it('clears the chip via its remove control', () => {
    const onChange = vi.fn()
    render(<NotableSelect label="Desired Notable 1" value="Prodigious Defence" partner={null} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('remove'))
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
