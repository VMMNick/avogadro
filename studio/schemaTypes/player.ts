import {defineField, defineType} from 'sanity'
import {UsersIcon} from '@sanity/icons/Users'

export const PLAYER_ROLES = [
  {title: "Зв'язуючий", value: 'setter'},
  {title: 'Догравальник', value: 'spiker'},
  {title: 'Центральний блокуючий', value: 'middle'},
  {title: 'Діагональний', value: 'opposite'},
  {title: 'Ліберо', value: 'libero'},
  {title: 'Тренерський штаб', value: 'staff'},
]

export default defineType({
  name: 'player',
  title: 'Гравці та Штаб',
  type: 'document',
  icon: UsersIcon,
  fields: [
    defineField({
      name: 'title',
      title: "ПІБ / Ім'я",
      type: 'string',
      validation: (rule) => rule.required().min(2).max(80),
    }),
    defineField({
      name: 'number',
      title: 'Ігровий номер',
      description: 'Для тренерського штабу можна залишити порожнім',
      type: 'number',
      validation: (rule) => rule.integer().min(0).max(99),
    }),
    defineField({
      name: 'role',
      title: 'Амплуа',
      type: 'string',
      options: {list: PLAYER_ROLES, layout: 'radio'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Фото гравця',
      description: 'Бажано вертикальне фото 3:4',
      type: 'image',
      options: {hotspot: true},
    }),
  ],
  orderings: [
    {title: 'За номером', name: 'numberAsc', by: [{field: 'number', direction: 'asc'}]},
    {title: 'За іменем', name: 'titleAsc', by: [{field: 'title', direction: 'asc'}]},
  ],
  preview: {
    select: {title: 'title', number: 'number', role: 'role', media: 'image'},
    prepare({title, number, role, media}) {
      const roleTitle = PLAYER_ROLES.find((r) => r.value === role)?.title ?? 'Амплуа не вказано'
      return {
        title: number != null ? `#${number} ${title ?? ''}` : title,
        subtitle: roleTitle,
        media,
      }
    },
  },
})
