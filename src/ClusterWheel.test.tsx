import { render } from '@testing-library/react'
import { ClusterWheel } from './ClusterWheel'
import { baseSmallIcon, notableIcon } from './icons'

const EMPTY = { left: null, right: null, back: null, small: null }

describe('ClusterWheel', () => {
  it('places the three notable icons and the base small art in the slots', () => {
    const { container } = render(
      <ClusterWheel
        slots={{
          left: notableIcon('Prodigious Defence'),
          back: notableIcon('Smite the Weak'),
          right: notableIcon('Feed the Fury'),
          small: baseSmallIcon(8),
        }}
        dimBack
      />,
    )
    const hrefs = [...container.querySelectorAll('pattern image')].map((i) => i.getAttribute('href'))
    expect(hrefs).toContain(notableIcon('Prodigious Defence'))
    expect(hrefs).toContain(notableIcon('Smite the Weak'))
    expect(hrefs).toContain(notableIcon('Feed the Fury'))
    expect(hrefs.filter((h) => h === baseSmallIcon(8))).toHaveLength(3)
  })

  it('renders dark sockets for null slots (no slot images at all)', () => {
    const { container } = render(<ClusterWheel slots={EMPTY} dimBack={false} />)
    expect(container.querySelectorAll('pattern image')).toHaveLength(0)
    expect(container.querySelectorAll('pattern rect[fill="#141414"]')).toHaveLength(6)
  })

  it('dims the back circle only when dimBack', () => {
    const dimmedRun = render(<ClusterWheel slots={EMPTY} dimBack />)
    const dimmed = [...dimmedRun.container.querySelectorAll('circle')].filter((c) => (c.getAttribute('style') ?? '').includes('opacity'))
    expect(dimmed).toHaveLength(1)
    const plainRun = render(<ClusterWheel slots={EMPTY} dimBack={false} />)
    const plain = [...plainRun.container.querySelectorAll('circle')].filter((c) => (c.getAttribute('style') ?? '').includes('opacity'))
    expect(plain).toHaveLength(0)
  })

  it('gives two instances distinct pattern ids', () => {
    const { container } = render(
      <div>
        <ClusterWheel slots={EMPTY} dimBack={false} />
        <ClusterWheel slots={EMPTY} dimBack={false} />
      </div>,
    )
    const ids = [...container.querySelectorAll('pattern')].map((p) => p.id)
    expect(ids).toHaveLength(14)
    expect(new Set(ids).size).toBe(14)
  })
})
