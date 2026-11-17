import { notFound } from 'next/navigation'

// Будь-яка невідома адреса під /en — англійська сторінка «не знайдено»
export default function Page() {
  notFound()
}
