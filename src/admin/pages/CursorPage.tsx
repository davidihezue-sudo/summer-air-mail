import { CursorFx } from '../../components/layout/CursorFx'
import { PAGES } from '../schema'
import { useAdmin } from '../store'
import { FormPage } from './FormPage'

/** The cursor settings form, with the live effect drawn over the admin so changes can be tried at once. */
export function CursorPage() {
  const { content } = useAdmin()
  const c = content.portfolio.cursor
  return (
    <>
      {c.enabled && <CursorFx settings={c} rgb="42,141,176" season="summer" imageSrc={c.image?.src} />}
      <FormPage page={PAGES.cursor} />
    </>
  )
}
