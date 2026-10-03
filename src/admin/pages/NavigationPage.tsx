import { useAdmin } from '../store'
import { Fields } from '../fields'
import { Card, PageHead } from '../ui'
import { buildNav, resolveSections } from '../../content/selectors'
import type { NavItem } from '../../content/types'
import { uid } from '../../content/factories'

export function NavigationPage() {
  const { content, set, edit } = useAdmin()
  const nav = content.portfolio.navigation
  const sections = resolveSections(content)
  const live = buildNav(content, sections)

  const toCustom = () => edit((c) => {
    c.portfolio.navigation.mode = 'custom'
    if (!c.portfolio.navigation.items.length) {
      c.portfolio.navigation.items = live.filter((n) => !n.external).map((n): NavItem => ({ id: uid('nav'), label: n.label, kind: 'section', target: n.target, visible: true }))
    }
  })

  return (
    <>
      <PageHead title="Navigation" intro="The menu at the top of the site. Automatic keeps it in step with your visible sections. Custom lets you rename, reorder, hide and add links. Links to hidden sections are never shown, so the menu cannot break." />
      <Card title="Mode">
        <div className="arow">
          <button type="button" className={`abtn ${nav.mode === 'auto' ? 'abtn--primary' : ''}`} aria-pressed={nav.mode === 'auto'} onClick={() => set('portfolio.navigation.mode', 'auto')}>Automatic</button>
          <button type="button" className={`abtn ${nav.mode === 'custom' ? 'abtn--primary' : ''}`} aria-pressed={nav.mode === 'custom'} onClick={toCustom}>Custom</button>
        </div>
        <p className="ahelp">Menu on the site right now: {live.length ? live.map((n) => n.label).join(', ') : 'empty'}.</p>
      </Card>
      {nav.mode === 'custom' ? (
        <Card title="Menu items">
          <div className="aform">
            <Fields base="portfolio.navigation" fields={[{
              kind: 'list', key: 'items', label: 'Items (drag to reorder)', addLabel: 'Add item', item: (n: NavItem) => `${n.label || 'New item'}${n.visible ? '' : ' (hidden)'}`,
              make: () => ({ id: uid('nav'), label: '', kind: 'section', target: sections[0]?.config.id ?? 'top', visible: true } satisfies NavItem),
              fields: [
                { kind: 'text', key: 'label', label: 'Label' },
                { kind: 'select', key: 'kind', label: 'Links to', options: [{ value: 'section', label: 'A section on this page' }, { value: 'external', label: 'An external page' }] },
                { kind: 'select', key: 'target', label: 'Section', showIf: (n: NavItem) => n.kind === 'section', options: () => sections.map((s) => ({ value: s.config.id, label: `${s.config.heading || s.config.navLabel || s.config.id}${s.visible ? '' : ' (not showing)'}` })) },
                { kind: 'url', key: 'target', label: 'Web address', showIf: (n: NavItem) => n.kind === 'external', placeholder: 'https://' },
                { kind: 'bool', key: 'visible', label: 'Show in the menu' },
              ],
            }]} />
          </div>
        </Card>
      ) : (
        <Card title="Automatic menu"><p className="ahelp">Labels come from each section's navigation label on the Sections & Visibility page.</p></Card>
      )}
    </>
  )
}
