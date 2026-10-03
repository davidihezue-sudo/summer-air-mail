import { useId, type ReactNode } from 'react'
import { Modal } from '../components/ui/Modal'

export function Switch({ checked, onChange, label, help, hideLabel }: { checked: boolean; onChange: (v: boolean) => void; label: string; help?: string; hideLabel?: boolean }) {
  const id = useId()
  return (
    <div className="aswitch">
      <button type="button" role="switch" aria-checked={checked} aria-labelledby={`${id}-l`} aria-describedby={help ? `${id}-h` : undefined} className="aswitch__btn" onClick={() => onChange(!checked)}>
        <span className="aswitch__knob" />
      </button>
      <span id={`${id}-l`} className={hideLabel ? 'sr-only' : 'aswitch__label'}>{label}</span>
      {help && <span id={`${id}-h`} className="ahelp">{help}</span>}
    </div>
  )
}

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'good' | 'warn' | 'info'; children: ReactNode }) {
  return <span className={`abadge abadge--${tone}`}>{children}</span>
}

export function PageHead({ title, intro, actions }: { title: string; intro?: string; actions?: ReactNode }) {
  return (
    <header className="apagehead">
      <div>
        <h1>{title}</h1>
        {intro && <p className="ahelp">{intro}</p>}
      </div>
      {actions && <div className="apagehead__actions">{actions}</div>}
    </header>
  )
}

export function Card({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="acard">
      {(title || actions) && <header className="acard__head">{title && <h2>{title}</h2>}{actions}</header>}
      {children}
    </section>
  )
}

export function Confirm({ open, title, body, confirmLabel = 'Delete', onConfirm, onCancel }: { open: boolean; title: string; body: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal open={open} onClose={onCancel} label={title} className="dialog dialog--narrow adialog" hideClose>
      <h2 className="adialog__title">{title}</h2>
      <p>{body}</p>
      <div className="adialog__actions">
        <button type="button" className="abtn" onClick={onCancel}>Cancel</button>
        <button type="button" className="abtn abtn--danger" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  )
}
