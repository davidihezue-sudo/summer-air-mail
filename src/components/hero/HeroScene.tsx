import { BookingButton } from '../layout/BookingButton'
import { track } from '../../utils/track'
import { useId } from 'react'
import { useContent } from '../../hooks/useContent'
import { useTheme } from '../../hooks/useTheme'
import { cvLink, hasValue } from '../../utils/text'
import { goTo } from '../../utils/nav'
import { Img } from '../ui/Img'
import { FlowersArt, PortraitPlaceholder, StampBgArt, StampFrameArt } from '../ui/art'

/**
 * One hero composition. It is rendered twice: once normally and once inside the
 * Night Tide circle (tinted and glowing). Both read the same CSS variables, so
 * tilt and scroll breakout stay perfectly in sync.
 */
export function HeroScene({ tide }: { tide?: boolean }) {
  const { content, idOf, sections } = useContent()
  const { season, resolved } = useTheme()
  const { profile, theme, hero } = content.portfolio
  const uid = useId().replace(/:/g, '')
  const Heading = tide ? 'div' : 'h1'
  const display = hasValue(profile.preferredName) ? profile.preferredName : profile.fullName

  const lines = hasValue(hero.headline) ? hero.headline.split('\n').filter((l) => l.trim()).slice(0, 5) : profile.roles.slice(0, 5)
  const label = hasValue(hero.label) ? hero.label : profile.title
  const intro = hasValue(hero.intro) ? hero.intro : profile.intro
  const cutout = resolved.override.heroCutout?.src ? resolved.override.heroCutout : profile.heroCutout
  const flowers = resolved.override.heroFlowers?.src ? resolved.override.heroFlowers : profile.heroFlowers
  const cv = cvLink(content.portfolio)

  const ctas = hero.ctas
    // A button only appears if the section it points to is actually on the page.
    .map((c) => ({ label: c.label, id: sections.some((s) => s.visible && s.config.id === c.target) ? c.target : undefined }))
    .filter((c) => hasValue(c.label) && c.id)
    .slice(0, 3)

  return (
    <div className={`scene ${tide ? 'scene--tide' : ''}`}>
      <div className="scene__text">
        <p className="eyebrow">{label}</p>
        <Heading className="hero-roles">
          {!tide && <span className="sr-only">{display}: </span>}
          {lines.map((r, i) => (
            <span key={r} className={`hero-roles__line hero-roles__line--${i % 3}`}>{r}</span>
          ))}
        </Heading>
        {hasValue(hero.supporting) && <p className="hero-supporting">{hero.supporting}</p>}
        <p className="hero-intro">{intro}</p>
        {(ctas.length > 0 || cv) && (
          <div className="hero-ctas">
            {ctas.map((c, i) =>
              tide ? (
                <span key={c.label} className={`btn ${i === 0 ? 'btn--solid' : 'btn--ghost'}`}>{c.label}</span>
              ) : (
                <a key={c.label} className={`btn ${i === 0 ? 'btn--solid' : 'btn--ghost'}`} href={`#${c.id}`} onClick={(e) => { e.preventDefault(); goTo(c.id!, c.id === idOf('contact') ? 'enquiry-name' : undefined) }}>
                  {c.label}
                </a>
              ),
            )}
            {cv && (tide ? <span className="btn btn--ghost">{cv.label}</span> : <a className="btn btn--ghost" href={cv.href} download={cv.filename} onClick={() => track('download', 'CV')}>{cv.label}</a>)}
            {!tide && <BookingButton place="hero" />}
          </div>
        )}
      </div>

      <div className="scene__stamp">
        <div className="stamp-float">
          <div className="stamp3d" role={tide ? undefined : 'img'} aria-label={tide ? undefined : `Postage stamp portrait of ${display}`}>
            <div className="layer layer--bg"><StampBgArt id={`perf${uid}${tide ? 't' : ''}`} season={season} /></div>
            <div className="layer layer--frame"><StampFrameArt numeral={theme.stampNumeral} label={resolved.theme.postLabel.replace(/ .*/, '') + ' POST'} /></div>
            {hero.decorativeElements && (
              <div className="layer layer--flowers">
                {flowers ? <Img image={flowers} eager className="layer-img" /> : <FlowersArt season={season} />}
              </div>
            )}
            <div className="layer layer--person">
              {cutout ? <Img image={cutout} eager className="layer-img" /> : <PortraitPlaceholder />}
            </div>
            <div className="stamp__shine" />
          </div>
        </div>
      </div>

      <p className="scene__closing">{profile.tagline}</p>
    </div>
  )
}
