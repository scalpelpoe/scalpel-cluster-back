import { fireEvent, render, screen } from '@testing-library/react'
import { NotablePicker } from './NotablePicker'

describe('NotablePicker', () => {
  it('filters the notable list by the search text', () => {
    render(<NotablePicker selected={[]} onChange={() => {}} />)
    fireEvent.change(screen.getByPlaceholderText('Filter notables'), { target: { value: 'prodig' } })
    expect(screen.getByText('Prodigious Defence')).toBeTruthy()
    expect(screen.queryByText('Feed the Fury')).toBeNull()
  })

  it('adds a notable on click and hides it from the addable list', () => {
    const onChange = vi.fn()
    render(<NotablePicker selected={[]} onChange={onChange} />)
    fireEvent.click(screen.getByText('Prodigious Defence'))
    expect(onChange).toHaveBeenCalledWith(['Prodigious Defence'])
  })

  it('renders selected notables as removable chips', () => {
    const onChange = vi.fn()
    render(<NotablePicker selected={['Prodigious Defence', 'Feed the Fury']} onChange={onChange} />)
    const chips = screen.getAllByLabelText('remove')
    expect(chips).toHaveLength(2)
    fireEvent.click(chips[0])
    expect(onChange).toHaveBeenCalledWith(['Feed the Fury'])
  })
})
