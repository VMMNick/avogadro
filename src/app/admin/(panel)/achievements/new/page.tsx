import { AchievementForm } from '@/components/admin/forms'
import { seasonOptions } from '@/lib/admin-lists'

export const metadata = { title: 'Нове досягнення' }

export default function NewAchievementPage() {
  return (
    <>
      <div className="adm-page-head">
        <h1>Нове досягнення</h1>
      </div>
      <AchievementForm seasons={seasonOptions().slice(1)} />
    </>
  )
}
