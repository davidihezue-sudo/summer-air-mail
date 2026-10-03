import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  label: string
  className?: string
  children: ReactNode
  /** Hide the built-in close button when the content provides its own. */
  hideClose?: boolean
}

/** Accessible modal built on the native <dialog>: focus trap, Escape, focus return. */
export function Modal({ open, onClose, label, className = '', children, hideClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
    document.documentElement.classList.toggle('is-locked', open)
    return () => document.documentElement.classList.remove('is-locked')
  }, [open])

  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-label={label}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {open && (
        <div className="modal__panel">
          {!hideClose && (
            <button type="button" className="modal__close" onClick={onClose} aria-label="Close dialog">
              <X aria-hidden size={22} />
            </button>
          )}
          {children}
        </div>
      )}
    </dialog>
  )
}
