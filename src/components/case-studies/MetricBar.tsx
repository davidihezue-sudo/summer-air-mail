import { motion } from 'framer-motion'
import type { Metric } from '../../content/types'
import { useMotion } from '../../hooks/useMotion'

export function MetricBar({ metric, locale }: { metric: Metric; locale: string }) {
  const { reduced } = useMotion()
  const fmt = (n: number) => `${metric.prefix ?? ''}${n.toLocaleString(locale, { maximumFractionDigits: 1 })}${metric.unit ?? ''}`
  const max = Math.max(metric.baseline ?? 0, metric.result) || 1
  const change = metric.baseline && metric.baseline > 0 ? ((metric.result - metric.baseline) / metric.baseline) * 100 : null
  const bar = (value: number, cls: string) => (
    <div className="metric__track">
      <motion.div
        className={`metric__bar ${cls}`}
        initial={reduced ? false : { width: 0 }}
        whileInView={{ width: `${(value / max) * 100}%` }}
        style={reduced ? { width: `${(value / max) * 100}%` } : undefined}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
  return (
    <figure className="metric">
      <figcaption className="metric__label">{metric.label}</figcaption>
      {metric.baseline !== undefined && (
        <div className="metric__row"><span>Baseline</span>{bar(metric.baseline, 'is-base')}<strong>{fmt(metric.baseline)}</strong></div>
      )}
      <div className="metric__row"><span>Result</span>{bar(metric.result, 'is-result')}<strong>{fmt(metric.result)}</strong></div>
      <p className="metric__meta">
        {change !== null && <span className="metric__change">{change >= 0 ? '+' : ''}{change.toFixed(0)}% vs baseline. </span>}
        Measured over {metric.period}.{metric.note ? ` ${metric.note}` : ''}
      </p>
    </figure>
  )
}
