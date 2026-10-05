import { useEffect, useState } from 'react'

/** A QR code drawn as one crisp shape. The encoder loads only when a QR code is shown. */
export function QrCode({ value, size = 220, label }: { value: string; size?: number; label: string }) {
  const [d, setD] = useState<{ path: string; n: number } | null>(null)
  useEffect(() => {
    let live = true
    void import('qrcode-generator').then(({ default: qrcode }) => {
      const qr = qrcode(0, 'M')
      qr.addData(value)
      qr.make()
      const n = qr.getModuleCount()
      let path = ''
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.isDark(y, x)) path += `M${x} ${y}h1v1h-1z`
      if (live) setD({ path, n })
    })
    return () => { live = false }
  }, [value])
  if (!d) return <span className="qr qr--wait" style={{ width: size, height: size }} aria-hidden />
  return (
    <svg className="qr" role="img" aria-label={label} viewBox={`-3 -3 ${d.n + 6} ${d.n + 6}`} width={size} height={size} shapeRendering="crispEdges">
      <rect x="-3" y="-3" width={d.n + 6} height={d.n + 6} fill="#fff" />
      <path d={d.path} fill="#17323f" />
    </svg>
  )
}
