import { fireEvent, render, screen, act } from '@testing-library/react'
import type { PoeItem, ScalpelPluginContext } from '@scalpelpoe/plugin-sdk'
import { defaultPoeItem } from '@scalpelpoe/plugin-sdk'
import { App } from './App'

function makeCtx(): { ctx: ScalpelPluginContext; fireItem: (item: PoeItem) => void } {
  let handler: ((item: PoeItem) => void) | null = null
  const ctx = {
    pluginId: 'cluster-jewel',
    pluginVersion: '1.0.0',
    getPoeVersion: () => 1,
    getLeague: () => 'Mercenaries',
    getCurrentItem: () => null,
    onCurrentItem: (h: (item: PoeItem) => void) => {
      handler = h
      return () => {
        handler = null
      }
    },
    openExternal: vi.fn(),
    log: () => {},
  } as unknown as ScalpelPluginContext
  return { ctx, fireItem: (item) => handler?.(item) }
}

function pick(boxIndex: number, text: string, optionName: string): void {
  const inputs = screen.getAllByPlaceholderText('Search notables')
  fireEvent.change(inputs[boxIndex], { target: { value: text } })
  fireEvent.click(screen.getByText(optionName))
}

describe('App', () => {
  it('renders the wheel and both labeled boxes with no results initially', () => {
    const { ctx } = makeCtx()
    const { container } = render(<App ctx={ctx} />)
    expect(container.querySelector('svg')).toBeTruthy()
    expect(screen.getByText('Desired Notable 1')).toBeTruthy()
    expect(screen.getByText('Desired Notable 3')).toBeTruthy()
    expect(screen.queryByText('Position 2 options')).toBeNull()
  })

  it('auto-loads results when both notables are picked', () => {
    const { ctx } = makeCtx()
    render(<App ctx={ctx} />)
    pick(0, 'prodig', 'Prodigious Defence')
    pick(0, 'feed the', 'Feed the Fury')
    expect(screen.getByText('Position 2 options')).toBeTruthy()
    expect(screen.getByText(/Smite the Weak \(ilvl 1\)/)).toBeTruthy()
  })

  it('limits the second box to compatible partners', () => {
    const { ctx } = makeCtx()
    render(<App ctx={ctx} />)
    pick(0, 'prodig', 'Prodigious Defence')
    const remaining = screen.getAllByPlaceholderText('Search notables')
    fireEvent.change(remaining[0], { target: { value: 'sadist' } })
    expect(screen.queryByText('Sadist')).toBeNull()
  })

  it('clearing a pick removes the results', () => {
    const { ctx } = makeCtx()
    render(<App ctx={ctx} />)
    pick(0, 'prodig', 'Prodigious Defence')
    pick(0, 'feed the', 'Feed the Fury')
    fireEvent.click(screen.getAllByLabelText('remove')[0])
    expect(screen.queryByText('Position 2 options')).toBeNull()
  })

  it('loads the copied jewel front pair from the strip', () => {
    const { ctx, fireItem } = makeCtx()
    render(<App ctx={ctx} />)
    act(() => {
      fireItem(
        defaultPoeItem({
          itemClass: 'Jewels',
          baseType: 'Large Cluster Jewel',
          enchants: ['Adds 8 Passive Skills'],
          explicits: [
            '1 Added Passive Skill is Feed the Fury',
            '1 Added Passive Skill is Smite the Weak',
            '1 Added Passive Skill is Prodigious Defence',
          ],
        }) as unknown as PoeItem,
      )
    })
    fireEvent.click(screen.getByText('Load pair'))
    expect(screen.getByText('Position 2 options')).toBeTruthy()
    expect(screen.getByText(/Smite the Weak \(ilvl 1\)/)).toBeTruthy()
  })

  it('keeps the strip on unrelated copies', () => {
    const { ctx, fireItem } = makeCtx()
    render(<App ctx={ctx} />)
    act(() => {
      fireItem(
        defaultPoeItem({
          itemClass: 'Jewels',
          baseType: 'Large Cluster Jewel',
          enchants: [],
          explicits: ['1 Added Passive Skill is Feed the Fury', '1 Added Passive Skill is Prodigious Defence'],
        }) as unknown as PoeItem,
      )
    })
    expect(screen.getByText('Load pair')).toBeTruthy()
    act(() => {
      fireItem(defaultPoeItem({ itemClass: 'Currency', baseType: 'Chaos Orb' }) as unknown as PoeItem)
    })
    expect(screen.getByText('Load pair')).toBeTruthy()
  })
})
