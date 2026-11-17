import { TeamForm } from '@/components/admin/forms'

export const metadata = { title: 'Нова команда' }

export default function NewTeamPage() {
  return (
    <>
      <div className="adm-page-head">
        <h1>Нова команда</h1>
      </div>
      <TeamForm />
    </>
  )
}
