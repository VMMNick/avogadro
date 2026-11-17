import 'server-only'
import QRCode from 'qrcode'

/** QR-код як SVG-рядок (векторний — чіткий і на екрані, і на папері). */
export function qrSvg(text: string, { dark = '#050d22', light = '#ffffff' } = {}) {
  return QRCode.toString(text, { type: 'svg', errorCorrectionLevel: 'M', margin: 1, color: { dark, light } })
}
