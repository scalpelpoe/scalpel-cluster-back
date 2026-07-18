import { DiamondThree } from '@icon-park/react'
import type { ScalpelPluginContext } from '@scalpelpoe/plugin-sdk'
import { renderToStaticMarkup } from 'react-dom/server'

const TAB_ICON = renderToStaticMarkup(<DiamondThree theme="two-tone" fill={['currentColor', 'rgba(255, 255, 255, 0.2)']} />)

export default function activate(ctx: ScalpelPluginContext): void {
  ctx.registerTab({
    label: 'Cluster Jewel Calculator',
    icon: TAB_ICON,
    render: (container) => {
      container.textContent = 'Cluster Jewel Calculator'
      return () => {
        container.textContent = ''
      }
    },
  })
}
