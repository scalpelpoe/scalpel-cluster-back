import { notableIcon } from './icons'

/** A notable's name with its passive icon (when known) and optional detail
 *  text like "(ilvl 50)". The single way notable names render in the UI. */
export function NotableLabel({ name, detail, size = 16 }: { name: string; detail?: string; size?: number }): JSX.Element {
  const icon = notableIcon(name)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, verticalAlign: 'middle' }}>
      {icon && <img src={icon} alt="" draggable={false} style={{ width: size, height: size, flexShrink: 0 }} />}
      {detail ? `${name} ${detail}` : name}
    </span>
  )
}
