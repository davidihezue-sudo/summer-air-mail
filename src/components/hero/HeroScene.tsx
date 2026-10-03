import { useId } from 'react'
import type { Portfolio } from '../../content/types'
import { hasValue } from '../../utils/text'
import { Img } from '../ui/Img'
import { FlowersArt, PortraitPlaceholder, StampBgArt, StampFrameArt } from '../ui/art'

interface Props {
  portfolio: Portfolio
  tide?: boolean
}

/**
 * One hero composition. It is rendered twice: once normally and once inside the
 * Night Tide circle (tinted and glowing). Both read the same CSS variables, so
 * tilt and scroll breakout stay perfectly in sync.
 */
export function HeroScene({ portfolio, tide }: Props) {
  const { profile, theme } = portfolio
  const uid = useId().replace(/:/g, '')
  const Heading = tide ? 'div' : 'h1'
  const display = hasValue(profile.preferredName) ? profile.preferredName : profile.fullName

  return (
    <div className={`scene ${tide ? 'scene--tide' : ''}`}>
      <div className="scene__text">
        <p className="eyebrow">{profile.title}</p>
        <Heading className="hero-roles">
          {!tide && <span className="sr-only">{display}: </span>}
          {profile.roles.slice(0, 5).map((r, i) => (
            <span key={r} className={`hero-roles__line hero-roles__line--${i % 3}`}>
              {r}
            </span>
          ))}
        </Heading>
        <p className="hero-intro">{profile.intro}</p>
      </div>

      <div className="scene__stamp">
        <div className="stamp-float">
          <div className="stamp3d" role={tide ? undefined : 'img'} aria-label={tide ? undefined : `Postage stamp portrait of ${display}`}>
            <div className="layer layer--bg"><StampBgArt id={`perf${uid}${tide ? 't' : ''}`} /></div>
            <div className="layer layer--frame"><StampFrameArt numeral={theme.stampNumeral} label="AIR MAIL" /></div>
            <div className="layer layer--flowers">
              {profile.heroFlowers ? <Img image={profile.heroFlowers} eager className="layer-img" /> : <FlowersArt />}
            </div>
            <div className="layer layer--person">
              {profile.heroCutout ? <Img image={profile.heroCutout} eager className="layer-img" /> : <PortraitPlaceholder />}
            </div>
            <div className="stamp__shine" />
          </div>
        </div>
      </div>

      <p className="scene__closing">{profile.tagline}</p>
    </div>
  )
}
