import type { ScalpelPluginContext } from '@scalpelpoe/plugin-sdk'
import { createRoot } from 'react-dom/client'
import { App } from './App'

// The user's cluster-notable silhouette as one stroked+filled path. The
// original mask-based outline rendered sub-pixel at the host's 16px clamp;
// stroke-width 5 in the 54-unit viewBox matches iconpark's visual weight.
// The two-tone interior matches the app's iconpark secondary. Source
// artwork: scripts/vendor/tab-icon.svg.
const TAB_ICON = `<svg viewBox="-4 -4 62 63" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M41.9854 1.52734L42.2969 4.5498L49.8281 3.82812L51.2949 3.6875L50.8838 5.10156L49.043 11.4551L51.8965 11.875L53.2949 12.0801L52.6357 13.3311L50.0342 18.2646C51.0755 20.9844 51.6475 23.9365 51.6475 27.0225C51.6475 30.1599 51.0561 33.1589 49.9814 35.916L50.1543 36.2285L52.9688 41.335L53.71 42.6797L52.1807 42.8135L49.1543 43.0801L49.7617 50.6211L49.8799 52.0889L48.4717 51.6572L42.1475 49.7197L41.6836 52.5674L41.458 53.9619L40.2168 53.2842L34.7754 50.3096C32.3746 51.0955 29.811 51.5225 27.1475 51.5225C24.2114 51.5225 21.396 51.0056 18.7871 50.0586L18.2041 50.3916L13.1406 53.2832L11.8076 54.0449L11.6504 52.5176L11.3379 49.4951L3.80762 50.2168L2.34082 50.3574L2.75195 48.9434L4.59277 42.5898L1.73926 42.1699L0.34082 41.9648L1 40.7139L3.99023 35.04C3.12059 32.5279 2.64746 29.8304 2.64746 27.0225C2.64746 24.3013 3.09128 21.6838 3.91016 19.2383L3.79004 19.0371L0.790039 14.0371L0 12.7207L1.52344 12.5303L4.53809 12.1533L3.6543 4.63965L3.48242 3.17676L4.90527 3.55664L11.2969 5.26074L11.6553 2.39844L11.8301 0.996094L13.0947 1.62793L18.2305 4.19531C20.9938 3.11505 24.0015 2.52246 27.1475 2.52246C29.9308 2.52246 32.6053 2.9877 35.0986 3.84277L35.4316 3.65332L40.4951 0.761719L41.8281 0L41.9854 1.52734Z" fill="rgba(255, 255, 255, 0.2)" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/></svg>`

export default function activate(ctx: ScalpelPluginContext): void {
  ctx.registerTab({
    label: 'Cluster Jewel Calculator',
    icon: TAB_ICON,
    render: (container) => {
      const root = createRoot(container)
      root.render(<App ctx={ctx} />)
      return () => root.unmount()
    },
  })
}
