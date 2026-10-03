import type { ReactNode } from 'react'
import type { SeasonName } from '../../content/types'

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

export function Blossom({ x, y, s = 1, rot = 0 }: { x: number; y: number; s?: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      {Array.from({ length: 5 }, (_, i) => (
        <ellipse key={i} cx="0" cy="-22" rx="14" ry="22" fill={i % 2 ? '#F4A8BD' : '#F8C2D2'} transform={`rotate(${i * 72})`} />
      ))}
      <circle r="9" fill="#F6D86B" />
      {Array.from({ length: 6 }, (_, i) => <circle key={i} cx={Math.cos(i * 1.05) * 5} cy={Math.sin(i * 1.05) * 5} r="1.2" fill="#B8862B" />)}
    </g>
  )
}

export function Leaf({ x, y, s = 1, rot = 0, fill = '#B5541F' }: { x: number; y: number; s?: number; rot?: number; fill?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M0 -44C26 -30 34 -4 18 22 10 34 4 40 0 46 -4 40 -10 34 -18 22 -34 -4 -26 -30 0 -44z" fill={fill} />
      <path d="M0 -38V44M0 -10l14 -12M0 6l16 -12M0 -10l-14 -12M0 6l-16 -12" stroke="rgb(0 0 0 / .28)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </g>
  )
}

export function Holly({ x, y, s = 1, rot = 0 }: { x: number; y: number; s?: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M0 0c-26-6-44 6-52 22 22 4 44-2 52-22zM0 0c26-6 44 6 52 22-22 4-44-2-52-22zM0 0c-10-24 0-44 14-52 8 22 0 42-14 52z" fill="#1F5A40" stroke="#123b29" strokeWidth="2" />
      <circle cx="-4" cy="6" r="7" fill="#B4303F" /><circle cx="8" cy="10" r="7" fill="#C23B4A" /><circle cx="2" cy="-2" r="6" fill="#A52A38" />
      <circle cx="-6" cy="3" r="1.6" fill="#fff" opacity=".6" />
    </g>
  )
}

/** Fallback decorative flowers when no image is configured. Re-drawn for each season. */
export function FlowersArt({ season = 'summer' }: { season?: SeasonName }) {
  return (
    <svg viewBox="0 0 420 540" className="layer-svg" aria-hidden focusable="false">
      {season === 'summer' && (
        <>
          <path d="M96 470c10-60 6-120-8-160" stroke={v('green')} strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M96 440c-30-6-46-24-50-40 24 0 44 10 50 40z" fill={v('sage')} />
          <Sunflower x={70} y={440} s={0.9} rot={-12} />
          <Sunflower x={365} y={150} s={0.62} rot={18} />
          <Sunflower x={388} y={470} s={0.5} rot={30} />
        </>
      )}
      {season === 'spring' && (
        <>
          <path d="M96 478c8-60 4-110-6-150" stroke={v('green')} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M94 446c-30-6-44-22-48-38 22 0 42 10 48 38z" fill={v('sage')} />
          <Blossom x={74} y={440} s={0.95} rot={-8} />
          <Blossom x={362} y={148} s={0.62} rot={14} />
          <Blossom x={390} y={472} s={0.5} rot={24} />
        </>
      )}
      {season === 'autumn' && (
        <>
          <Leaf x={70} y={444} s={1.05} rot={-28} fill="#A3501F" />
          <Leaf x={112} y={470} s={0.7} rot={34} fill="#C98B2B" />
          <Leaf x={362} y={150} s={0.7} rot={22} fill="#7E1F2E" />
          <Leaf x={390} y={468} s={0.6} rot={-20} fill="#C26A2A" />
        </>
      )}
      {season === 'winter' && (
        <>
          <Holly x={78} y={448} s={0.95} rot={-14} />
          <Holly x={364} y={152} s={0.62} rot={150} />
          <Holly x={388} y={474} s={0.5} rot={-30} />
        </>
      )}
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

export function StampBgArt({ id = 'perf', season = 'summer' }: { id?: string; season?: SeasonName }) {
  return (
    <svg viewBox="0 0 420 540" className="layer-svg" aria-hidden focusable="false">
      <defs>
        {scallopMask(id)}
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          {season === 'winter' ? (
            <>
              <stop offset="0" stopColor={v('ink')} />
              <stop offset=".65" stopColor={v('sea')} />
              <stop offset="1" stopColor={v('aqua')} />
            </>
          ) : season === 'autumn' ? (
            <>
              <stop offset="0" stopColor={v('sky')} />
              <stop offset=".55" stopColor={v('peach')} />
              <stop offset="1" stopColor={v('butter')} />
            </>
          ) : season === 'spring' ? (
            <>
              <stop offset="0" stopColor={v('sky')} />
              <stop offset=".6" stopColor={v('pink')} />
              <stop offset="1" stopColor={v('butter')} />
            </>
          ) : (
            <>
              <stop offset="0" stopColor={v('sky')} />
              <stop offset=".6" stopColor={v('aqua')} />
              <stop offset="1" stopColor={v('butter')} />
            </>
          )}
        </linearGradient>
      </defs>
      <g mask={`url(#${id})`}>
        <rect width="420" height="540" fill={v('paper')} />
        <rect x="50" y="50" width="320" height="440" fill={`url(#${id}-sky)`} />
        {season === 'summer' && (
          <>
            <circle cx="130" cy="150" r="44" fill={v('butter')} opacity=".9" />
            <path d="M50 400c40-18 80-18 120 0s80 18 120 0 60-12 80-4v94H50z" fill={v('sea')} opacity=".55" />
            <path d="M50 430c40-14 80-14 120 0s80 14 120 0 60-10 80-3v63H50z" fill={v('sea')} opacity=".7" />
          </>
        )}
        {season === 'spring' && (
          <>
            <circle cx="300" cy="130" r="36" fill={v('butter')} opacity=".85" />
            <path d="M50 150C120 120 200 90 370 70" stroke="#6b4a37" strokeWidth="6" fill="none" strokeLinecap="round" />
            {[[110, 134], [160, 112], [215, 98], [270, 86], [330, 74], [140, 150], [250, 110]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={9 + (i % 3) * 2} fill={i % 2 ? '#F6B9CB' : '#FBD3DF'} />)}
            <path d="M50 420c60-50 120-40 180-10s100 30 140-10v90H50z" fill={v('sage')} />
            <path d="M50 450c70-34 130-24 200 0s90 10 120-6v46H50z" fill={v('green')} opacity=".75" />
          </>
        )}
        {season === 'autumn' && (
          <>
            <circle cx="150" cy="330" r="62" fill={v('peach')} />
            <path d="M50 400c70-40 130-20 190 0s90 30 130 6v84H50z" fill={v('stone')} opacity=".85" />
            <path d="M50 440c60-20 130-10 190 10s90 8 130-8v48H50z" fill={v('red')} opacity=".8" />
            <path d="M300 440V300M300 340l-36-30M300 320l40-34M300 380l-30-20" stroke="#4b2e22" strokeWidth="7" fill="none" strokeLinecap="round" />
            {[[262, 296, '#A3501F'], [340, 282, '#7E1F2E'], [300, 270, '#C98B2B'], [270, 342, '#C26A2A'], [336, 330, '#A3501F'], [312, 306, '#E3A33B']].map(([x, y, c], i) => <circle key={i} cx={x as number} cy={y as number} r={20 + (i % 2) * 6} fill={c as string} opacity=".92" />)}
          </>
        )}
        {season === 'winter' && (
          <>
            {[[90, 100], [150, 150], [220, 80], [300, 140], [340, 90], [120, 220], [260, 200], [330, 230], [80, 160]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 1.6 : 2.4} fill="#fff" opacity=".9" />)}
            <circle cx="290" cy="130" r="30" fill={v('paper')} />
            <circle cx="278" cy="124" r="30" fill={v('ink')} opacity=".18" />
            <path d="M50 390c60-34 120-34 180-8s100 14 140-12v120H50z" fill={v('paper')} />
            <path d="M50 430c70-26 140-14 210 4s80 6 110-6v68H50z" fill={v('sand')} />
            {[[110, 400], [160, 418], [320, 398]].map(([x, y], i) => (
              <g key={i} transform={`translate(${x} ${y}) scale(${1 - i * 0.15})`}>
                <path d="M0 -70L-26 -20H-14L-34 18H-18L-40 56H40L18 18H34L14 -20H26z" fill={v('green')} />
                <rect x="-5" y="56" width="10" height="14" fill="#4b2e22" />
              </g>
            ))}
          </>
        )}
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
      <text x="210" y="507" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" letterSpacing="3.5" fontWeight="700" fill={v('paper')}>{label}</text>
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

export function PostMark({ name, label = 'SUMMER AIR MAIL' }: { name: string; label?: string }) {
  const text = `${name.toUpperCase()} • ${label} • PORTFOLIO • `.repeat(2)
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

export type ObjectName = string

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
    case 'tulip':
      return (
        <svg {...p}>
          <path d="M60 112V58" stroke={v('green')} strokeWidth="6" strokeLinecap="round" />
          <path d="M60 100c-26-2-34-18-34-34 24 2 34 14 34 34zM60 92c22-2 32-16 32-30-22 2-32 12-32 30z" fill={v('sage')} />
          <path d="M34 28c0 24 12 40 26 40s26-16 26-40c-8 6-16 4-26-8-10 12-18 14-26 8z" fill={v('pink')} stroke={v('red')} strokeWidth="3" strokeLinejoin="round" />
          <path d="M60 20v46" stroke={v('red')} strokeWidth="2" opacity=".5" />
        </svg>
      )
    case 'wateringcan':
      return (
        <svg {...p}>
          <path d="M30 50h54l-4 50a8 8 0 0 1-8 8H42a8 8 0 0 1-8-8z" fill={v('sage')} stroke={v('ink')} strokeWidth="3" strokeLinejoin="round" />
          <path d="M84 62l24-26" stroke={v('ink')} strokeWidth="6" strokeLinecap="round" />
          <path d="M104 28l10 10-6 6-10-10z" fill={v('ink')} />
          <path d="M34 54c-18-6-20 22-2 22M42 50c10-16 34-16 42 0" stroke={v('ink')} strokeWidth="5" fill="none" strokeLinecap="round" />
          {[0, 1, 2].map((i) => <circle key={i} cx={112 + i * 2} cy={52 + i * 12} r="2.4" fill={v('sea')} />)}
        </svg>
      )
    case 'boots':
      return (
        <svg {...p}>
          {[0, 1].map((i) => (
            <g key={i} transform={`translate(${i * 44} ${i * 4})`}>
              <path d="M12 10h30v52c0 6 4 10 12 12 6 2 6 10 0 12H14c-6 0-8-6-4-10l4-4z" fill={v('peach')} stroke={v('ink')} strokeWidth="3" strokeLinejoin="round" />
              <rect x="12" y="14" width="30" height="8" fill={v('red')} opacity=".85" />
              <path d="M12 98h42" stroke={v('ink')} strokeWidth="3" />
            </g>
          ))}
        </svg>
      )
    case 'cherries':
      return (
        <svg {...p}>
          <path d="M40 80C44 50 56 30 74 18M82 82C78 50 74 32 74 18" stroke={v('green')} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M74 18c14-10 28-8 34 4-14 6-26 4-34-4z" fill={v('sage')} />
          <circle cx="40" cy="88" r="20" fill={v('red')} /><circle cx="84" cy="90" r="20" fill={v('red')} />
          <circle cx="33" cy="82" r="5" fill="#fff" opacity=".45" /><circle cx="77" cy="84" r="5" fill="#fff" opacity=".45" />
        </svg>
      )
    case 'notebook':
      return (
        <svg {...p}>
          <rect x="26" y="12" width="68" height="96" rx="6" fill={v('red')} stroke={v('ink')} strokeWidth="3" />
          <rect x="34" y="12" width="6" height="96" fill="rgb(0 0 0 / .18)" />
          {[24, 40, 56, 72, 88].map((y) => <circle key={y} cx="26" cy={y} r="4" fill={v('paper')} stroke={v('ink')} strokeWidth="2" />)}
          <rect x="50" y="32" width="34" height="5" rx="2.5" fill={v('paper')} /><rect x="50" y="44" width="24" height="4" rx="2" fill={v('paper')} opacity=".8" />
          <path d="M84 12v96" stroke={v('butter')} strokeWidth="5" />
        </svg>
      )
    case 'mug':
      return (
        <svg {...p}>
          <path d="M30 44h56v40a20 20 0 0 1-20 20H50a20 20 0 0 1-20-20z" fill={v('paper')} stroke={v('ink')} strokeWidth="3" strokeLinejoin="round" />
          <path d="M86 54h6a12 12 0 0 1 0 28h-8" stroke={v('ink')} strokeWidth="5" fill="none" />
          <rect x="30" y="58" width="56" height="10" fill={v('red')} opacity=".85" />
          <path d="M46 34c-6-8 6-12 0-20M62 34c-6-8 6-12 0-20M78 34c-6-8 6-12 0-20" stroke={v('stone')} strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      )
    case 'apple':
      return (
        <svg {...p}>
          <path d="M60 36c-14-12-40-6-40 26 0 28 20 48 40 40 20 8 40-12 40-40 0-32-26-38-40-26z" fill={v('red')} stroke={v('ink')} strokeWidth="3" strokeLinejoin="round" />
          <path d="M60 36c0-12 4-20 12-24" stroke={v('ink')} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M66 22c10-10 22-8 26 0-10 6-20 6-26 0z" fill={v('sage')} />
          <path d="M34 54c-4 8-2 18 2 24" stroke="#fff" strokeOpacity=".4" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      )
    case 'ornament':
      return (
        <svg {...p}>
          <path d="M60 8v14" stroke={v('stone')} strokeWidth="4" strokeLinecap="round" />
          <rect x="50" y="20" width="20" height="12" rx="3" fill={v('butter')} stroke={v('ink')} strokeWidth="2.5" />
          <circle cx="60" cy="70" r="38" fill={v('red')} stroke={v('ink')} strokeWidth="3" />
          <path d="M24 62c20 10 52 10 72 0M24 82c20 10 52 10 72 0" stroke={v('paper')} strokeWidth="4" fill="none" />
          <path d="M60 50l4 9 10 1-8 7 3 10-9-6-9 6 3-10-8-7 10-1z" fill={v('butter')} />
          <circle cx="42" cy="52" r="6" fill="#fff" opacity=".35" />
        </svg>
      )
    case 'mittens':
      return (
        <svg {...p}>
          {[0, 1].map((i) => (
            <g key={i} transform={`translate(${i * 50} ${i * 4}) rotate(${i ? 8 : -8} 30 60)`}>
              <path d="M14 14c-4-8 8-12 12-2l2 14c0-12 4-14 8-14 8 0 10 8 10 18v40H14z" fill={v('red')} stroke={v('ink')} strokeWidth="3" strokeLinejoin="round" />
              <rect x="10" y="78" width="38" height="22" rx="4" fill={v('paper')} stroke={v('ink')} strokeWidth="3" />
              <path d="M14 88h30" stroke={v('stone')} strokeWidth="3" strokeDasharray="4 4" />
              <path d="M18 38l8 8-8 8M32 38l8 8-8 8" stroke={v('paper')} strokeWidth="2.5" fill="none" />
            </g>
          ))}
        </svg>
      )
    case 'scarf':
      return (
        <svg {...p}>
          <path d="M12 34c24-24 72-24 96 0l-8 24c-26-14-54-14-80 0z" fill={v('red')} stroke={v('ink')} strokeWidth="3" strokeLinejoin="round" />
          <path d="M66 52l30 6-6 48-30-6z" fill={v('red')} stroke={v('ink')} strokeWidth="3" strokeLinejoin="round" />
          <path d="M20 40c22-14 58-14 80 0M24 48c20-10 52-10 72 0" stroke={v('paper')} strokeWidth="4" fill="none" />
          <path d="M70 66l22 4M68 78l22 4" stroke={v('paper')} strokeWidth="4" />
          {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${64 + i * 6} ${99 + i * -1}v10`} stroke={v('red')} strokeWidth="3" strokeLinecap="round" />)}
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
