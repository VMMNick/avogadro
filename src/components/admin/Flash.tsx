export function Flash({ params }: { params: Record<string, string> }) {
  const message = params.saved ? 'Збережено. Зміни вже на сайті.' : params.deleted ? 'Видалено.' : null
  if (!message) return null
  return (
    <div className="adm-alert adm-alert-ok" role="status" style={{ marginBottom: 20 }}>
      {message}
    </div>
  )
}
