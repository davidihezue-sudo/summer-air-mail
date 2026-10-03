import { Fields } from '../fields'
import type { PageForm } from '../schema'
import { Card, PageHead } from '../ui'

export function FormPage({ page }: { page: PageForm }) {
  return (
    <>
      <PageHead title={page.title} intro={page.intro} />
      {page.blocks.map((b, i) => (
        <Card key={i} title={b.title}>
          <div className="aform"><Fields fields={b.fields} base={b.base} /></div>
        </Card>
      ))}
    </>
  )
}
