import { allNotables } from './data'
import { notableIcon } from './icons'
import iconsJson from './data/notable-icons.json'

describe('notableIcon', () => {
  it('returns a PNG data URI for every notable', () => {
    for (const n of allNotables()) {
      const icon = notableIcon(n.name)
      expect(icon, n.name).toMatch(/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/)
    }
  })

  it('returns null for unknown names', () => {
    expect(notableIcon('Total Fabrication')).toBeNull()
  })

  it('bundles real 32px PNGs', () => {
    const { icons, byNotable } = iconsJson as { icons: Record<string, string>; byNotable: Record<string, string> }
    for (const base of Object.values(byNotable)) expect(icons[base], base).toBeDefined()
    for (const [base, uri] of Object.entries(icons)) {
      const buf = Buffer.from(uri.split(',')[1], 'base64')
      expect(buf.subarray(0, 4), base).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]))
      // PNG IHDR width lives at bytes 16-19.
      expect(buf.readUInt32BE(16), base).toBe(32)
    }
  })
})
