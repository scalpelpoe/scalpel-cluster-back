import type { PoeItem, ScalpelPluginContext } from '@scalpelpoe/plugin-sdk'
import { useEffect, useState } from 'react'
import { calculatePair, middlesOnBase } from './calculator'
import { analyzeClusterItem, type CopiedJewelAnalysis } from './clipboard'
import { ClusterWheel } from './ClusterWheel'
import { CopiedJewelStrip } from './CopiedJewelStrip'
import { getNotable } from './data'
import { baseSmallIcon, notableIcon } from './icons'
import { NotableSelect } from './NotableSelect'
import { ResultsPanel } from './ResultsPanel'
import { PANEL_BOX, RESULTS_MIN_HEIGHT } from './ui'

export function App({ ctx }: { ctx: ScalpelPluginContext }): JSX.Element {
  const [copied, setCopied] = useState<CopiedJewelAnalysis | null>(() => {
    const item = ctx.getCurrentItem()
    return item ? analyzeClusterItem(item) : null
  })
  const [notable1, setNotable1] = useState<string | null>(null)
  const [notable3, setNotable3] = useState<string | null>(null)
  const [baseChoice, setBaseChoice] = useState<string>('any')

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

  const basesWithMiddles = pair?.ok ? pair.sharedBases.filter((b) => middlesOnBase(pair.middles, b).length > 0) : []
  const knownBase = !pair?.ok
    ? null
    : basesWithMiddles.length === 1
      ? basesWithMiddles[0]
      : baseChoice !== 'any'
        ? Number(baseChoice)
        : null

  return (
    <div style={{ padding: 12, color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {pair ? (
        <ResultsPanel pair={pair} choice={baseChoice} onChoiceChange={setBaseChoice} getLeague={() => ctx.getLeague()} onOpenTrade={(url) => ctx.openExternal(url)} />
      ) : (
        <div style={{ ...PANEL_BOX, padding: 10, minHeight: RESULTS_MIN_HEIGHT, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Back Notable Options</div>
          <div style={{ opacity: 0.6, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
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
            small: knownBase != null ? baseSmallIcon(knownBase) : null,
          }}
          dimBack={false}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <NotableSelect
          label="Desired Notable 1"
          value={notable1}
          partner={notable3}
          onChange={(v) => {
            setNotable1(v)
            setBaseChoice('any')
          }}
        />
        <NotableSelect
          label="Desired Notable 2"
          value={notable3}
          partner={notable1}
          onChange={(v) => {
            setNotable3(v)
            setBaseChoice('any')
          }}
        />
      </div>
      {copied && (
        <CopiedJewelStrip
          analysis={copied}
          onLoad={([a, b]) => {
            setNotable1(a)
            setNotable3(b)
            setBaseChoice('any')
          }}
        />
      )}
    </div>
  )
}
