import type { PoeItem, ScalpelPluginContext } from '@scalpelpoe/plugin-sdk'
import { useEffect, useState } from 'react'
import { calculatePair } from './calculator'
import { analyzeClusterItem, type CopiedJewelAnalysis } from './clipboard'
import { ClusterWheel } from './ClusterWheel'
import { CopiedJewelStrip } from './CopiedJewelStrip'
import { getNotable } from './data'
import { notableIcon } from './icons'
import { NotableSelect } from './NotableSelect'
import { ResultsPanel } from './ResultsPanel'

export function App({ ctx }: { ctx: ScalpelPluginContext }): JSX.Element {
  const [copied, setCopied] = useState<CopiedJewelAnalysis | null>(() => {
    const item = ctx.getCurrentItem()
    return item ? analyzeClusterItem(item) : null
  })
  const [notable1, setNotable1] = useState<string | null>(null)
  const [notable3, setNotable3] = useState<string | null>(null)

  useEffect(
    () =>
      ctx.onCurrentItem((item: PoeItem) => {
        const a = analyzeClusterItem(item)
        // Keep the last qualifying jewel when something unrelated is copied.
        if (a) setCopied(a)
      }),
    [ctx],
  )

  const pair = notable1 && notable3 ? calculatePair(notable1, notable3) : null

  // The wheel shows geometric truth: lower rid sits front-left. A single
  // pick sits on its own box's side until the pair decides the order.
  let leftName = notable1
  let rightName = notable3
  if (notable1 && notable3) {
    const n1 = getNotable(notable1)
    const n3 = getNotable(notable3)
    if (n1 && n3 && n3.rid < n1.rid) {
      leftName = notable3
      rightName = notable1
    }
  }

  return (
    <div style={{ padding: 12, color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {pair ? (
        <ResultsPanel pair={pair} getLeague={() => ctx.getLeague()} onOpenTrade={(url) => ctx.openExternal(url)} />
      ) : (
        <div className="setting-box" style={{ padding: 10, minHeight: 96 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Position 2 options</div>
          <div style={{ opacity: 0.6 }}>
            Pick both desired notables. Every notable that can roll into the skippable middle position will be listed here.
          </div>
        </div>
      )}
      <div style={{ maxWidth: 240, margin: '0 auto', width: '100%' }}>
        <ClusterWheel
          slots={{
            left: leftName ? notableIcon(leftName) : null,
            right: rightName ? notableIcon(rightName) : null,
            back: null,
            small: null,
          }}
          dimBack={false}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <NotableSelect label="Desired Notable 1" value={notable1} partner={notable3} onChange={setNotable1} />
        <NotableSelect label="Desired Notable 3" value={notable3} partner={notable1} onChange={setNotable3} />
      </div>
      {copied && (
        <CopiedJewelStrip
          analysis={copied}
          onLoad={([a, b]) => {
            setNotable1(a)
            setNotable3(b)
          }}
        />
      )}
    </div>
  )
}
