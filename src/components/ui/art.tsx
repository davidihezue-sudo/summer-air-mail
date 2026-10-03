import type { ReactNode } from 'react'
import type { Service } from '../../content/types'

/* Hand-built SVG illustrations. All colours reference theme CSS variables. */

const v = (n: string) => `var(--c-${n})`

export function Sunflower({ x, y, s = 1, rot = 0 }: { x: number; y: number; s?: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      {Array.from({ length: 14 }, (_, i) => (
        <ellipse key={i} cx="0" cy="-34" rx="9" ry="22" fill={i % 2 ? '#F2B72E' : '#F7CA45'} transform={`rotate(${(i * 360) / 14})`} />
      ))}
      <circle r="20" fill="#5B3A1E" />
      <circle r="12" fill="#7A4E26" />
      {Array.from({ length: 8 }, (_, i) => (
        <circle key={i} cx={Math.cos(i) * 8} cy={Math.sin(i) * 8} r="1.4" fill="#3C2412" />
      ))}
    </g>
  )
}

/** Fallback decorative flowers when no flower PNG is configured. */
export function FlowersArt() {
  return (
    <svg viewBox="0 0 420 540" className="layer-svg" aria-hidden focusable="false">
      <path d="M96 470c10-60 6-120-8-160" stroke={v('green')} strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M96 440c-30-6-46-24-50-40 24 0 44 10 50 40z" fill={v('sage')} />
      <Sunflower x={70} y={440} s={0.9} rot={-12} />
      <Sunflower x={365} y={150} s={0.62} rot={18} />
      <Sunflower x={388} y={470} s={0.5} rot={30} />
    </svg>
  )
}

function scallopMask(id: string) {
  const dots: ReactNode[] = []
  const r = 9
  for (let x = 14; x < 420; x += 28) {
    dots.push(<circle key={`t${x}`} cx={x} cy={0} r={r} fill="#000" />)
    dots.push(<circle key={`b${x}`} cx={x} cy={540} r={r} fill="#000" />)
  }
  for (let y = 14; y < 540; y += 28) {
    dots.push(<circle key={`l${y}`} cx={0} cy={y} r={r} fill="#000" />)
    dots.push(<circle key={`r${y}`} cx={420} cy={y} r={r} fill="#000" />)
  }
  return (
    <mask id={id}>
      <rect width="420" height="540" fill="#fff" />
      {dots}
    </mask>
  )
}

export function StampBgArt({ id = 'perf' }: { id?: string }) {
  return (
    <svg viewBox="0 0 420 540" className="layer-svg" aria-hidden focusable="false">
      <defs>
        {scallopMask(id)}
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={v('sky')} />
          <stop offset=".6" stopColor={v('aqua')} />
          <stop offset="1" stopColor={v('butter')} />
        </linearGradient>
      </defs>
      <g mask={`url(#${id})`}>
        <rect width="420" height="540" fill={v('paper')} />
        <rect x="50" y="50" width="320" height="440" fill={`url(#${id}-sky)`} />
        <circle cx="130" cy="150" r="44" fill={v('butter')} opacity=".9" />
        <path d="M50 400c40-18 80-18 120 0s80 18 120 0 60-12 80-4v94H50z" fill={v('sea')} opacity=".55" />
        <path d="M50 430c40-14 80-14 120 0s80 14 120 0 60-10 80-3v63H50z" fill={v('sea')} opacity=".7" />
      </g>
    </svg>
  )
}

export function StampFrameArt({ numeral, label }: { numeral: string; label: string }) {
  return (
    <svg viewBox="0 0 420 540" className="layer-svg" aria-hidden focusable="false">
      <path fillRule="evenodd" fill={v('green')} d="M28 28h364v484H28zM50 50v440h320V50z" />
      <path d="M50 490V390a100 100 0 0 1 100 100z" fill={v('green')} />
      <text x="352" y="104" textAnchor="end" fontFamily="var(--font-display)" fontSize="62" fill={v('red')}>{numeral}</text>
      <text x="62" y="76" fontFamily="var(--font-body)" fontSize="11" letterSpacing="3" fontWeight="700" fill={v('red')}>{label}</text>
    </svg>
  )
}

export function PortraitPlaceholder() {
  return (
    <svg viewBox="0 0 300 380" className="layer-svg portrait-ph" aria-hidden focusable="false">
      <path d="M20 380c6-92 54-130 130-130s124 38 130 130z" fill={v('ink')} />
      <rect x="128" y="196" width="44" height="60" rx="14" fill="#C58A63" />
      <ellipse cx="150" cy="150" rx="58" ry="70" fill="#D9A07A" />
      <path d="M88 150c-6-62 38-92 70-84 34-4 62 30 54 86-10-38-28-52-62-50-30 0-52 14-62 48z" fill="#2B1B14" />
      <rect x="40" y="20" width="220" height="30" rx="15" fill={v('paper')} opacity=".9" />
      <text x="150" y="40" textAnchor="middle" fontFamily="var(--font-body)" fontSize="13" fontWeight="700" fill={v('red')}>ADD YOUR PORTRAIT CUTOUT</text>
    </svg>
  )
}

export function PostMark({ name }: { name: string }) {
  const text = `${name.toUpperCase()} • SUMMER AIR MAIL • PORTFOLIO • `.repeat(2)
  return (
    <svg viewBox="0 0 240 240" className="postmark" aria-hidden focusable="false">
      <defs>
        <path id="pm-ring" d="M120 120m-92 0a92 92 0 1 1 184 0a92 92 0 1 1-184 0" />
      </defs>
      <circle cx="120" cy="120" r="108" fill="none" stroke={v('red')} strokeWidth="5" />
      <circle cx="120" cy="120" r="70" fill="none" stroke={v('red')} strokeWidth="2" />
      <g className="postmark__ring">
        <text fontFamily="var(--font-body)" fontWeight="700" fontSize="13" letterSpacing="3" fill={v('red')}>
          <textPath href="#pm-ring" textLength="570">{text.slice(0, 80)}</textPath>
        </text>
      </g>
    </svg>
  )
}

export function Surfboard() {
  return (
    <svg viewBox="0 0 60 200" className="surfboard" aria-hidden focusable="false">
      <path d="M30 4C10 40 6 110 14 170c2 14 8 24 16 26 8-2 14-12 16-26 8-60 4-130-16-166z" fill={v('red')} />
      <path d="M30 4v192" stroke={v('paper')} strokeWidth="3" />
      <path d="M12 80h36M13 120h34" stroke={v('paper')} strokeWidth="5" />
    </svg>
  )
}

export function Surfer() {
  return (
    <svg viewBox="0 0 40 28" width="40" height="28" aria-hidden focusable="false">
      <path d="M2 24c8 3 24 3 36 0" stroke={v('ink')} strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="20" cy="6" r="3" fill={v('ink')} />
      <path d="M20 9l-3 8 5 3M20 11l6-3M17 17l-4 3" stroke={v('ink')} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  )
}

type ObjectName = NonNullable<Service['object']>

export function TowelObject({ name }: { name: ObjectName }) {
  const p = { viewBox: '0 0 120 120', 'aria-hidden': true, focusable: 'false' as const, className: 'towel-art' }
  switch (name) {
    case 'sunglasses':
      return (
        <svg {...p}>
          <path d="M8 46c0-4 3-6 7-6h6M112 46c0-4-3-6-7-6h-6" stroke={v('ink')} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M16 44h38c2 22-4 36-20 36S14 62 16 44z" fill={v('ink')} />
          <path d="M104 44H66c-2 22 4 36 20 36s20-18 18-36z" fill={v('ink')} />
          <path d="M54 48c5-5 7-5 12 0" stroke={v('ink')} strokeWidth="5" fill="none" />
          <path d="M24 52c4-2 8-2 10 2" stroke="#fff" strokeOpacity=".5" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      )
    case 'sunscreen':
      return (
        <svg {...p}>
          <rect x="40" y="10" width="40" height="14" rx="4" fill={v('red')} />
          <rect x="30" y="24" width="60" height="88" rx="12" fill={v('butter')} stroke={v('ink')} strokeWidth="3" />
          <circle cx="60" cy="62" r="14" fill={v('peach')} />
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} d="M60 40v-6" stroke={v('peach')} strokeWidth="3" strokeLinecap="round" transform={`rotate(${i * 45} 60 62)`} />
          ))}
          <rect x="42" y="90" width="36" height="6" rx="3" fill={v('ink')} opacity=".7" />
        </svg>
      )
    case 'camera':
      return (
        <svg {...p}>
          <rect x="12" y="30" width="96" height="70" rx="10" fill={v('paper')} stroke={v('ink')} strokeWidth="3" />
          <rect x="12" y="42" width="96" height="10" fill={v('red')} />
          <rect x="12" y="52" width="96" height="6" fill={v('butter')} />
          <circle cx="60" cy="75" r="20" fill={v('ink')} />
          <circle cx="60" cy="75" r="12" fill={v('sea')} />
          <circle cx="55" cy="70" r="3" fill="#fff" opacity=".7" />
          <rect x="22" y="20" width="20" height="10" rx="3" fill={v('ink')} />
          <circle cx="90" cy="38" r="3" fill={v('pink')} />
        </svg>
      )
    case 'flipflops':
      return (
        <svg {...p}>
          {[0, 1].map((i) => (
            <g key={i} transform={`translate(${i * 46} ${i * 4}) rotate(${i ? 6 : -6} 30 60)`}>
              <path d="M30 8c-16 0-22 18-20 44s6 54 20 56 18-30 20-56S46 8 30 8z" fill={v('pink')} stroke={v('ink')} strokeWidth="3" />
              <path d="M30 34l-10 14M30 34l10 14M30 34v-8" stroke={v('green')} strokeWidth="5" strokeLinecap="round" fill="none" />
            </g>
          ))}
        </svg>
      )
    case 'phone':
      return (
        <svg {...p}>
          <rect x="34" y="8" width="52" height="104" rx="10" fill={v('ink')} />
          <rect x="39" y="18" width="42" height="84" rx="4" fill={v('aqua')} />
          <path d="M60 78c-14-9-16-18-10-24 4-4 9-2 10 2 1-4 6-6 10-2 6 6 4 15-10 24z" fill={v('red')} />
          <rect x="52" y="12" width="16" height="3" rx="1.5" fill="#fff" opacity=".4" />
        </svg>
      )
    case 'watermelon':
    default:
      return (
        <svg {...p}>
          <path d="M10 44a50 50 0 0 0 100 0z" fill={v('green')} />
          <path d="M16 44a44 44 0 0 0 88 0z" fill={v('sage')} />
          <path d="M22 44a38 38 0 0 0 76 0z" fill={v('red')} />
          {[[44, 58], [60, 66], [76, 58], [52, 74], [68, 76]].map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx="2.4" ry="4" fill={v('ink')} transform={`rotate(-20 ${x} ${y})`} />
          ))}
        </svg>
      )
  }
}

export function Footprints() {
  return (
    <svg className="footprints" viewBox="0 0 400 40" aria-hidden focusable="false">
      {Array.from({ length: 10 }, (_, i) => (
        <g key={i} className="footprints__step" style={{ animationDelay: `${i * 0.35}s` }} transform={`translate(${i * 38 + 10} ${i % 2 ? 24 : 8})`}>
          <ellipse cx="0" cy="0" rx="5" ry="8" fill={v('stone')} />
          <circle cx="-4" cy="-11" r="1.6" fill={v('stone')} />
          <circle cx="0" cy="-12.5" r="1.6" fill={v('stone')} />
          <circle cx="4" cy="-11" r="1.6" fill={v('stone')} />
        </g>
      ))}
    </svg>
  )
}
