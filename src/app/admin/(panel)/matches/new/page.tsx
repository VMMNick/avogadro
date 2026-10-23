import { MatchForm } from '@/components/admin/forms'

export const metadata = { title: 'Новий матч' }

export default function NewMatchPage() {
  return (
    <>
      <div className="adm-page-head">
        <h1>Новий матч</h1>
      </div>
      <MatchForm />
    </>
  )
}
