import { TrainingForm } from '@/components/admin/forms'
import { getDirectoryOptions } from '@/lib/data'
import { toOptions } from '@/lib/directory'

export const metadata = { title: 'Нове тренування' }

export default async function NewTrainingPage() {
  const { venues } = toOptions(await getDirectoryOptions())
  return (
    <>
      <div className="adm-page-head">
        <h1>Нове тренування</h1>
      </div>
      <TrainingForm venues={venues} />
    </>
  )
}
