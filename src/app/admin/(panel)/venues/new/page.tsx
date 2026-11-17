import { VenueForm } from '@/components/admin/forms'

export const metadata = { title: 'Новий зал' }

export default function NewVenuePage() {
  return (
    <>
      <div className="adm-page-head">
        <h1>Новий зал</h1>
      </div>
      <VenueForm />
    </>
  )
}
