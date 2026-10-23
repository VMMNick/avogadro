import { getSettings } from '@/lib/data'
import { SettingsForm } from '@/components/admin/forms'

export const metadata = { title: 'Налаштування сайту' }

export default async function SettingsPage() {
  const s = await getSettings()
  return (
    <>
      <div className="adm-page-head">
        <h1>Налаштування сайту</h1>
      </div>
      <SettingsForm
        settings={{
          tagline: s?.tagline ?? null,
          about: s?.about ?? null,
          phone: s?.phone ?? null,
          email: s?.email ?? null,
          address: s?.address ?? null,
          mapQuery: s?.mapQuery ?? null,
          instagram: s?.instagram ?? null,
          facebook: s?.facebook ?? null,
          telegram: s?.telegram ?? null,
        }}
      />
    </>
  )
}
