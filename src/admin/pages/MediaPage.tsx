import { MediaLibrary } from '../media'
import { Card, PageHead } from '../ui'

export function MediaPage() {
  return (
    <>
      <PageHead title="Media Library" intro="Every photo, video, screenshot, PDF and logo in one place. Upload once and reuse it anywhere. Add alt text so everyone can understand your images." />
      <Card><MediaLibrary /></Card>
    </>
  )
}
