import { fireEvent, render, screen } from '@testing-library/react'
import { NotableSelect } from './NotableSelect'

describe('NotableSelect', () => {
  it('shows no options until text is typed', () => {
    render(<NotableSelect label="Desired Notable 1" value={null} partner={null} onChange={() => {}} />)
    expect(screen.getByText('Desired Notable 1')).toBeTruthy()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('filters options by typed text and picks on click', () => {
    const onChange = vi.fn()
    render(<NotableSelect label="Desired Notable 1" value={null} partner={null} onChange={onChange} />)
    fireEvent.change(screen.getByPlaceholderText('Search notables'), { target: { value: 'prodig' } })
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
    render(<NotableSelect label="Desired Notable 3" value={null} partner="Prodigious Defence" onChange={() => {}} />)
    const input = screen.getByPlaceholderText('Search notables')
    fireEvent.change(input, { target: { value: 'sadist' } })
    expect(screen.queryByText('Sadist')).toBeNull()
    fireEvent.change(input, { target: { value: 'feed the' } })
    expect(screen.getByText('Feed the Fury')).toBeTruthy()
  })

  it('renders the picked value with a clear control', () => {
    const onChange = vi.fn()
    render(<NotableSelect label="Desired Notable 1" value="Prodigious Defence" partner={null} onChange={onChange} />)
    expect(screen.getByText('Prodigious Defence')).toBeTruthy()
    expect(screen.queryByPlaceholderText('Search notables')).toBeNull()
    fireEvent.click(screen.getByLabelText('remove'))
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
