import { fireEvent, render, screen } from '@testing-library/react'
import { analyzeClusterItem } from './clipboard'
import { defaultPoeItem, type PoeItem } from '@scalpelpoe/plugin-sdk'
import { CopiedJewelPanel } from './CopiedJewelPanel'

function analysis(explicits: string[]) {
  const a = analyzeClusterItem(
    defaultPoeItem({ itemClass: 'Jewels', baseType: 'Large Cluster Jewel', explicits, enchants: ['Adds 8 Passive Skills'] }) as unknown as PoeItem,
  )
  if (!a) throw new Error('expected analysis')
  return a
}

describe('CopiedJewelPanel', () => {
  it('labels the three positions and flags the middle as skippable', () => {
    const a = analysis([
      '1 Added Passive Skill is Feed the Fury',
      '1 Added Passive Skill is Smite the Weak',
      '1 Added Passive Skill is Prodigious Defence',
    ])
    render(<CopiedJewelPanel analysis={a} onLoadPair={() => {}} />)
    const items = screen.getAllByRole('listitem').map((li) => li.textContent ?? '')
    expect(items[0]).toContain('1. Prodigious Defence')
    expect(items[1]).toContain('2. Smite the Weak')
    expect(items[2]).toContain('3. Feed the Fury')
    expect(screen.getByText(/skippable/i)).toBeTruthy()
  })

  it('loads positions 1 and 3 into the calculator', () => {
    const a = analysis([
      '1 Added Passive Skill is Feed the Fury',
      '1 Added Passive Skill is Smite the Weak',
      '1 Added Passive Skill is Prodigious Defence',
    ])
    const onLoadPair = vi.fn()
    render(<CopiedJewelPanel analysis={a} onLoadPair={onLoadPair} />)
    fireEvent.click(screen.getByText('Load pair into calculator'))
    expect(onLoadPair).toHaveBeenCalledWith(['Prodigious Defence', 'Feed the Fury'])
  })

  it('notes the open middle for a 2-notable jewel', () => {
    const a = analysis(['1 Added Passive Skill is Feed the Fury', '1 Added Passive Skill is Prodigious Defence'])
    render(<CopiedJewelPanel analysis={a} onLoadPair={() => {}} />)
    expect(screen.getByText(/middle position open/i)).toBeTruthy()
  })

  it('lists unrecognized notables', () => {
    const a = analysis(['1 Added Passive Skill is Total Fabrication', '1 Added Passive Skill is Heavy Hitter', '1 Added Passive Skill is Prodigious Defence'])
    render(<CopiedJewelPanel analysis={a} onLoadPair={() => {}} />)
    expect(screen.getByText(/Total Fabrication/)).toBeTruthy()
  })
})
