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

const S = { stroke: v('ink'), strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }

/** A drawing of the thing a capability is about. The shapes are fixed; the colours follow the season. */
export function TowelObject({ name }: { name: ObjectName }) {
  const p = { viewBox: '0 0 120 120', 'aria-hidden': true, focusable: 'false' as const, className: 'towel-art' }
  switch (name) {
    case 'compass':
      return (
        <svg {...p}>
          <circle cx="60" cy="60" r="48" fill={v('paper')} {...S} />
          <circle cx="60" cy="60" r="38" fill="none" stroke={v('sea')} strokeWidth="2" strokeDasharray="2 6" />
          <path d="M60 14v8M60 98v8M14 60h8M98 60h8" {...S} fill="none" />
          <path d="M60 24l12 36-12-5-12 5z" fill={v('red')} {...S} strokeWidth={2.5} />
          <path d="M60 96L48 60l12 5 12-5z" fill={v('sky')} {...S} strokeWidth={2.5} />
          <circle cx="60" cy="60" r="5" fill={v('butter')} {...S} strokeWidth={2.5} />
        </svg>
      )
    case 'camera':
      return (
        <svg {...p}>
          <rect x="12" y="30" width="96" height="70" rx="10" fill={v('paper')} {...S} />
          <rect x="12" y="42" width="96" height="10" fill={v('red')} />
          <rect x="12" y="52" width="96" height="6" fill={v('butter')} />
          <circle cx="60" cy="75" r="20" fill={v('ink')} />
          <circle cx="60" cy="75" r="12" fill={v('sea')} />
          <circle cx="55" cy="70" r="3" fill="#fff" opacity=".7" />
          <rect x="22" y="20" width="20" height="10" rx="3" fill={v('ink')} />
          <circle cx="90" cy="38" r="3" fill={v('pink')} />
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
    case 'palette':
      return (
        <svg {...p}>
          <path d="M60 12C32 12 12 32 12 58c0 22 16 40 36 40 8 0 10-6 8-12-2-6 2-10 8-10h14c16 0 30-6 30-22C108 30 88 12 60 12z" fill={v('butter')} {...S} />
          <circle cx="36" cy="50" r="7" fill={v('red')} /><circle cx="56" cy="32" r="7" fill={v('sea')} />
          <circle cx="82" cy="36" r="7" fill={v('green')} /><circle cx="92" cy="60" r="7" fill={v('pink')} />
          <circle cx="44" cy="76" r="8" fill={v('paper')} {...S} strokeWidth={2.5} />
        </svg>
      )
    case 'megaphone':
      return (
        <svg {...p}>
          <path d="M18 46h22l46-24v76L40 74H18z" fill={v('red')} {...S} />
          <path d="M36 74l6 26h13l-5-24" fill={v('butter')} {...S} />
          <path d="M96 44c7 7 7 25 0 32M105 34c13 13 13 39 0 52" fill="none" stroke={v('ink')} strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      )
    case 'chart':
      return (
        <svg {...p}>
          <rect x="12" y="12" width="96" height="96" rx="10" fill={v('paper')} {...S} />
          <rect x="26" y="70" width="16" height="28" rx="2" fill={v('sea')} />
          <rect x="52" y="58" width="16" height="40" rx="2" fill={v('pink')} />
          <rect x="78" y="44" width="16" height="54" rx="2" fill={v('green')} />
          <path d="M20 100h80" stroke={v('ink')} strokeWidth="3" strokeLinecap="round" />
          <path d="M24 58l24-16 16 8 30-28M82 22h12v12" fill="none" stroke={v('red')} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'pen':
      return (
        <svg {...p}>
          <path d="M22 98l8-28L80 20l20 20-50 50z" fill={v('butter')} {...S} />
          <path d="M22 98l8-28 20 20z" fill={v('peach')} {...S} />
          <path d="M80 20l8-8a6 6 0 0 1 8 0l12 12a6 6 0 0 1 0 8l-8 8z" fill={v('pink')} {...S} />
          <path d="M72 28l20 20" {...S} fill="none" />
          <path d="M62 106h44" stroke={v('ink')} strokeWidth="3" strokeLinecap="round" />
        </svg>
      )
    case 'clapper':
      return (
        <svg {...p}>
          <rect x="14" y="48" width="92" height="58" rx="6" fill={v('paper')} {...S} />
          <g transform="rotate(-10 14 44)">
            <rect x="14" y="26" width="92" height="20" rx="4" fill={v('ink')} />
            <path d="M32 26l-8 20h14l8-20zM58 26l-8 20h14l8-20zM84 26l-8 20h14l8-20z" fill={v('paper')} />
          </g>
          <path d="M50 68l28 15-28 15z" fill={v('red')} {...S} strokeWidth={2.5} />
        </svg>
      )
    case 'bubbles':
      return (
        <svg {...p}>
          <path d="M22 14h54a10 10 0 0 1 10 10v32a10 10 0 0 1-10 10H44L26 82V66h-4a10 10 0 0 1-10-10V24a10 10 0 0 1 10-10z" fill={v('aqua')} {...S} />
          <circle cx="34" cy="40" r="4" fill={v('ink')} /><circle cx="49" cy="40" r="4" fill={v('ink')} /><circle cx="64" cy="40" r="4" fill={v('ink')} />
          <path d="M50 54h48a10 10 0 0 1 10 10v26a10 10 0 0 1-10 10h-6v14L74 100H50a10 10 0 0 1-10-10V64a10 10 0 0 1 10-10z" fill={v('pink')} {...S} />
          <path d="M74 90c-12-8-14-15-9-19 3-3 7-1 9 3 2-4 6-6 9-3 5 4 3 11-9 19z" fill={v('red')} />
        </svg>
      )
    case 'seedling':
      return (
        <svg {...p}>
          <path d="M60 80V44" stroke={v('green')} strokeWidth="5" strokeLinecap="round" />
          <path d="M60 60c-22 0-30-14-30-28 20 0 30 8 30 28z" fill={v('sage')} {...S} strokeWidth={2.5} />
          <path d="M60 50c18 0 26-12 26-26-18 0-26 6-26 26z" fill={v('green')} {...S} strokeWidth={2.5} />
          <path d="M34 82h52l-6 26H40z" fill={v('peach')} {...S} />
          <rect x="30" y="76" width="60" height="10" rx="3" fill={v('red')} {...S} strokeWidth={2.5} />
        </svg>
      )
    case 'star':
      return (
        <svg {...p}>
          <path d="M60 10l15 32 35 4-26 24 7 35-31-18-31 18 7-35L10 46l35-4z" fill={v('butter')} {...S} />
          <path d="M98 14v12M92 20h12M20 92v10M15 97h10" stroke={v('ink')} strokeWidth="3" strokeLinecap="round" />
        </svg>
      )
    case 'magnifier':
      return (
        <svg {...p}>
          <path d="M76 76l30 30" stroke={v('ink')} strokeWidth="11" strokeLinecap="round" />
          <circle cx="52" cy="52" r="34" fill={v('aqua')} {...S} strokeWidth={5} />
          <path d="M32 46c4-10 12-15 21-15" fill="none" stroke={v('paper')} strokeWidth="5" strokeLinecap="round" />
        </svg>
      )
    case 'mail':
      return (
        <svg {...p}>
          <rect x="10" y="26" width="100" height="70" rx="8" fill={v('paper')} {...S} />
          <path d="M12 32l48 38 48-38z" fill={v('butter')} {...S} />
          <path d="M12 94l36-30M108 94L72 64" fill="none" stroke={v('ink')} strokeWidth="3" strokeLinecap="round" />
        </svg>
      )
    case 'chip':
      return (
        <svg {...p}>
          <path d="M44 14v16M60 14v16M76 14v16M44 90v16M60 90v16M76 90v16M14 44h16M14 60h16M14 76h16M90 44h16M90 60h16M90 76h16" stroke={v('ink')} strokeWidth="5" strokeLinecap="round" />
          <rect x="28" y="28" width="64" height="64" rx="8" fill={v('ink')} />
          <rect x="42" y="42" width="36" height="36" rx="4" fill={v('sea')} />
          <path d="M60 46l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill={v('butter')} />
        </svg>
      )
    case 'book':
      return (
        <svg {...p}>
          <path d="M60 30c-12-10-30-12-46-8v62c16-4 34-2 46 8z" fill={v('paper')} {...S} />
          <path d="M60 30c12-10 30-12 46-8v62c-16-4-34-2-46 8z" fill={v('butter')} {...S} />
          <path d="M24 42c8-2 16-1 24 3M24 56c8-2 16-1 24 3M24 70c8-2 16-1 24 3M72 45c8-4 16-5 24-3M72 59c8-4 16-5 24-3" stroke={v('stone')} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M82 20v30l7-6 7 6V22z" fill={v('red')} />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...p}>
          <rect x="14" y="22" width="92" height="84" rx="10" fill={v('paper')} {...S} />
          <path d="M14 32a10 10 0 0 1 10-10h72a10 10 0 0 1 10 10v16H14z" fill={v('red')} {...S} />
          <rect x="34" y="12" width="8" height="20" rx="4" fill={v('ink')} /><rect x="78" y="12" width="8" height="20" rx="4" fill={v('ink')} />
          {[0, 1, 2, 3].map((c) => [0, 1].map((r) => <circle key={`${c}${r}`} cx={32 + c * 19} cy={68 + r * 20} r="5" fill={c === 2 && r === 0 ? v('sea') : v('stone')} opacity={c === 2 && r === 0 ? 1 : 0.5} />))}
        </svg>
      )
    default:
      return null
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
