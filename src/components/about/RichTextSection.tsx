import type { SectionConfig } from '../../content/types'
import { Section } from '../ui/Section'
import { RichText } from '../ui/RichText'

/** A free text section the owner can add (and duplicate) from the admin. */
export function RichTextSection({ config }: { config: SectionConfig }) {
  return (
    <Section config={config} tone="var(--c-paper)" className="richtext">
      <div className="richtext__body"><RichText text={config.body} /></div>
    </Section>
  )
}
