import { act, fireEvent, render, screen } from '@testing-library/react'
import type { PoeItem, ScalpelPluginContext } from '@scalpelpoe/plugin-sdk'
import { defaultPoeItem } from '@scalpelpoe/plugin-sdk'
import { App } from './App'

function makeCtx(overrides: Partial<ScalpelPluginContext> = {}): { ctx: ScalpelPluginContext; fireItem: (item: PoeItem) => void } {
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
    ...overrides,
  } as unknown as ScalpelPluginContext
  return { ctx, fireItem: (item) => handler?.(item) }
}

describe('App', () => {
  it('requires two selected notables before calculating', () => {
    const { ctx } = makeCtx()
    render(<App ctx={ctx} />)
    expect(screen.getByText(/select at least 2 notables/i)).toBeTruthy()
  })

  it('calculates pair results from the picker selection', () => {
    const { ctx } = makeCtx()
    render(<App ctx={ctx} />)
    fireEvent.change(screen.getByPlaceholderText('Filter notables'), { target: { value: 'Prodigious' } })
    fireEvent.click(screen.getByText('Prodigious Defence'))
    fireEvent.change(screen.getByPlaceholderText('Filter notables'), { target: { value: 'Feed the' } })
    fireEvent.click(screen.getByText('Feed the Fury'))
    fireEvent.click(screen.getByText('Calculate'))
    expect(screen.getByText(/Position 2 options: Smite the Weak/)).toBeTruthy()
  })

  it('shows the copied-jewel panel when a Large Cluster Jewel is copied, and keeps it on unrelated copies', () => {
    const { ctx, fireItem } = makeCtx()
    render(<App ctx={ctx} />)
    expect(screen.queryByText(/Copied jewel/)).toBeNull()
    act(() => {
      fireItem(
        defaultPoeItem({
          itemClass: 'Jewels',
          baseType: 'Large Cluster Jewel',
          enchants: ['Adds 8 Passive Skills'],
          explicits: ['1 Added Passive Skill is Prodigious Defence', '1 Added Passive Skill is Feed the Fury'],
        }) as unknown as PoeItem,
      )
    })
    expect(screen.getByText(/Copied jewel/)).toBeTruthy()
    act(() => {
      fireItem(defaultPoeItem({ itemClass: 'Currency', baseType: 'Chaos Orb' }) as unknown as PoeItem)
    })
    expect(screen.getByText(/Copied jewel/)).toBeTruthy()
  })

  it('seeds the picker from the copied jewel', () => {
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
    fireEvent.click(screen.getByText('Load pair into calculator'))
    fireEvent.click(screen.getByText('Calculate'))
    expect(screen.getByText(/Position 2 options: Smite the Weak/)).toBeTruthy()
  })
})
