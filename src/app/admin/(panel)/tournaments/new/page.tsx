import { TournamentForm } from '@/components/admin/forms'

export const metadata = { title: 'Новий турнір' }

export default function NewTournamentPage() {
  return (
    <>
      <div className="adm-page-head">
        <h1>Новий турнір</h1>
      </div>
      <TournamentForm />
    </>
  )
}
