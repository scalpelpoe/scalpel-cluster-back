import type { ReactNode } from 'react'

// Test-only mock of @scalpelpoe/plugin-sdk RUNTIME exports. The real npm package
// is a types-only stub that throws at runtime, so vitest aliases this file in.
// tsc does not use the alias, so production types still come from the real pkg.

export function Button({ children, onClick, disabled }: { children?: ReactNode; onClick?: () => void; disabled?: boolean; variant?: string; size?: string }) {
  return <button onClick={onClick} disabled={disabled}>{children}</button>
}
export function TextInput(props: Record<string, unknown>) {
  return <input {...props} />
}
export function RemoveButton({ onClick }: { onClick?: () => void }) {
  return <button aria-label="remove" onClick={onClick}>x</button>
}
export function Notice({ title, body }: { icon?: ReactNode; title?: ReactNode; body?: ReactNode }) {
  return <div>{title} {body}</div>
}
// Mirrors src/shared/poe-item.ts in the Scalpel repo.
export function isClusterJewel(item: { itemClass: string; baseType: string }): boolean {
  return item.itemClass === 'Jewels' && item.baseType.endsWith('Cluster Jewel')
}
export function defaultPoeItem(overrides: Record<string, unknown>, _version?: 1 | 2): Record<string, unknown> {
  return {
    itemClass: '',
    rarity: 'Rare',
    name: '',
    baseType: '',
    itemLevel: 0,
    explicits: [],
    implicits: [],
    enchants: [],
    ...overrides,
  }
}
