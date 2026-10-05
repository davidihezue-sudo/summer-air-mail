import * as mo from 'framer-motion/m'
import type { ChartPoint } from '../../content/types'
import { useMotion } from '../../hooks/useMotion'

interface ChartProps {
  points: ChartPoint[]
  title?: string
  prefix?: string
  unit?: string
  locale: string
}

const fmt = (n: number, locale: string, prefix = '', unit = '') => `${prefix}${n.toLocaleString(locale, { maximumFractionDigits: 1 })}${unit}`

function DataTable({ points, title, prefix, unit, locale }: ChartProps) {
  return (
    <table className="sr-only">
      <caption>{title || 'Chart data'}</caption>
      <thead><tr><th>Label</th><th>Value</th></tr></thead>
      <tbody>{points.map((p) => <tr key={p.label}><td>{p.label}</td><td>{fmt(p.value, locale, prefix, unit)}</td></tr>)}</tbody>
    </table>
  )
}

/** Simple, honest line chart. The axis starts at zero so growth is not exaggerated. */
export function LineChart(props: ChartProps) {
  const { points, prefix, unit, locale, title } = props
  const { reduced } = useMotion()
  if (points.length < 2) return null
  const W = 600, H = 240, padL = 16, padR = 16, padT = 28, padB = 36
  const max = Math.max(...points.map((p) => p.value), 1)
  const x = (i: number) => padL + (i * (W - padL - padR)) / (points.length - 1)
  const y = (v: number) => padT + (1 - v / max) * (H - padT - padB)
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join('')
  const area = `${d}L${x(points.length - 1)} ${H - padB}L${x(0)} ${H - padB}z`
  const summary = `${title || 'Line chart'}: ${points.map((p) => `${p.label} ${fmt(p.value, locale, prefix, unit)}`).join(', ')}`
  return (
    <figure className="chart">
      {title && <figcaption className="chart__title">{title}</figcaption>}
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary} className="chart__svg">
        <line x1={padL} x2={W - padR} y1={H - padB} y2={H - padB} stroke="currentColor" opacity=".25" />
        <path d={area} fill="var(--c-green)" opacity=".1" />
        <mo.path
          d={d} fill="none" stroke="var(--c-green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          initial={reduced ? false : { pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        {points.map((p, i) => (
          <g key={p.label}>
            <circle cx={x(i)} cy={y(p.value)} r="5" fill="var(--c-paper)" stroke="var(--c-green)" strokeWidth="3" />
            <text x={x(i)} y={y(p.value) - 12} textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor">{fmt(p.value, locale, prefix, unit)}</text>
            <text x={x(i)} y={H - 12} textAnchor="middle" fontSize="12" fill="currentColor" opacity=".75">{p.label}</text>
          </g>
        ))}
      </svg>
      <DataTable {...props} />
    </figure>
  )
}

export function BarChart(props: ChartProps) {
  const { points, prefix, unit, locale, title } = props
  const { reduced } = useMotion()
  if (!points.length) return null
  const W = 600, H = 240, padT = 28, padB = 40
  const max = Math.max(...points.map((p) => p.value), 1)
  const slot = (W - 32) / points.length
  const bw = Math.min(64, slot * 0.6)
  const summary = `${title || 'Bar chart'}: ${points.map((p) => `${p.label} ${fmt(p.value, locale, prefix, unit)}`).join(', ')}`
  return (
    <figure className="chart">
      {title && <figcaption className="chart__title">{title}</figcaption>}
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary} className="chart__svg">
        <line x1="16" x2={W - 16} y1={H - padB} y2={H - padB} stroke="currentColor" opacity=".25" />
        {points.map((p, i) => {
          const h = Math.max(2, (p.value / max) * (H - padT - padB))
          const cx = 16 + slot * i + slot / 2
          return (
            <g key={p.label}>
              <mo.rect
                x={cx - bw / 2} width={bw} rx="4" fill={i === points.length - 1 ? 'var(--c-green)' : 'var(--c-stone)'}
                initial={reduced ? false : { height: 0, y: H - padB }} whileInView={{ height: h, y: H - padB - h }} viewport={{ once: true }} transition={{ duration: 0.9, delay: i * 0.08 }}
                {...(reduced ? { y: H - padB - h, height: h } : {})}
              />
              <text x={cx} y={H - padB - h - 8} textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor">{fmt(p.value, locale, prefix, unit)}</text>
              <text x={cx} y={H - 16} textAnchor="middle" fontSize="12" fill="currentColor" opacity=".75">{p.label}</text>
            </g>
          )
        })}
      </svg>
      <DataTable {...props} />
    </figure>
  )
}
