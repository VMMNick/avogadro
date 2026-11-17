import 'server-only'

/**
 * Повідомлення в Telegram (необов'язково): якщо задано TELEGRAM_BOT_TOKEN і TELEGRAM_CHAT_ID.
 * Помилка відправки не заважає збереженню заявки — вона все одно є в адмінці.
 */
export async function notifyTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return false
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) console.error('Telegram: не вдалося надіслати', res.status)
    return res.ok
  } catch (err) {
    console.error('Telegram: не вдалося надіслати', err)
    return false
  }
}
