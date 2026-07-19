import { fireEvent, render, screen } from '@testing-library/react'
import { defaultPoeItem, type PoeItem } from '@scalpelpoe/plugin-sdk'
import { analyzeClusterItem } from './clipboard'
import { CopiedJewelStrip } from './CopiedJewelStrip'

function analysis(explicits: string[]) {
  const a = analyzeClusterItem(
    defaultPoeItem({ itemClass: 'Jewels', baseType: 'Large Cluster Jewel', explicits, enchants: ['Adds 8 Passive Skills'] }) as unknown as PoeItem,
  )
  if (!a) throw new Error('expected analysis')
  return a
}

describe('CopiedJewelStrip', () => {
  it('shows the front pair, flags the back notable, and loads the pair', () => {
    const a = analysis([
      '1 Added Passive Skill is Feed the Fury',
      '1 Added Passive Skill is Smite the Weak',
      '1 Added Passive Skill is Prodigious Defence',
    ])
    const onLoad = vi.fn()
    render(<CopiedJewelStrip analysis={a} onLoad={onLoad} />)
    expect(screen.getByText('Prodigious Defence')).toBeTruthy()
    expect(screen.getByText('Feed the Fury')).toBeTruthy()
    expect(screen.getByText(/skippable/)).toBeTruthy()
    fireEvent.click(screen.getByText('Load pair'))
    expect(onLoad).toHaveBeenCalledWith(['Prodigious Defence', 'Feed the Fury'])
  })

  it('renders nothing with fewer than 2 recognized notables', () => {
    const a = analysis(['1 Added Passive Skill is Prodigious Defence'])
    const { container } = render(<CopiedJewelStrip analysis={a} onLoad={() => {}} />)
    expect(container.innerHTML).toBe('')
  })
})
