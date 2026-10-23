import { PlayerForm } from '@/components/admin/forms'

export const metadata = { title: 'Новий гравець' }

export default function NewPlayerPage() {
  return (
    <>
      <div className="adm-page-head">
        <h1>Новий гравець</h1>
      </div>
      <PlayerForm />
    </>
  )
}
