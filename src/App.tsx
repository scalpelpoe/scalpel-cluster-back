import type { PoeItem, ScalpelPluginContext } from '@scalpelpoe/plugin-sdk'
import { Button } from '@scalpelpoe/plugin-sdk'
import { useEffect, useState } from 'react'
import { calculateAll, type PairResult } from './calculator'
import { analyzeClusterItem, type CopiedJewelAnalysis } from './clipboard'
import { CopiedJewelPanel } from './CopiedJewelPanel'
import { NotablePicker } from './NotablePicker'
import { PairResultCard } from './PairResultCard'

export function App({ ctx }: { ctx: ScalpelPluginContext }): JSX.Element {
  const [copied, setCopied] = useState<CopiedJewelAnalysis | null>(() => {
    const item = ctx.getCurrentItem()
    return item ? analyzeClusterItem(item) : null
  })
  const [selected, setSelected] = useState<string[]>([])
  const [results, setResults] = useState<PairResult[] | null>(null)

  useEffect(
    () =>
      ctx.onCurrentItem((item: PoeItem) => {
        const a = analyzeClusterItem(item)
        // Keep the last qualifying jewel when something unrelated is copied.
        if (a) setCopied(a)
      }),
    [ctx],
  )

  function loadPair(names: [string, string]): void {
    setSelected(names)
    setResults(null)
  }

  const sortedResults = results == null ? null : [...results].sort((a, b) => Number(b.ok) - Number(a.ok))

  return (
    <div style={{ padding: 12, color: 'var(--text)' }}>
      {copied && copied.recognized.length + copied.unknown.length >= 2 && (
        <CopiedJewelPanel analysis={copied} onLoadPair={loadPair} />
      )}
      <div className="section-title">Desired notables</div>
      <NotablePicker selected={selected} onChange={(s) => { setSelected(s); setResults(null) }} />
      <div style={{ margin: '10px 0' }}>
        {selected.length < 2 ? (
          <div style={{ opacity: 0.7 }}>Select at least 2 notables to calculate.</div>
        ) : (
          <Button onClick={() => setResults(calculateAll(selected))}>Calculate</Button>
        )}
      </div>
      {sortedResults?.map((pair) => (
        <PairResultCard
          key={`${pair.name1}|${pair.name3}`}
          pair={pair}
          getLeague={() => ctx.getLeague()}
          onOpenTrade={(url) => ctx.openExternal(url)}
        />
      ))}
    </div>
  )
}
