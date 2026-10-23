import {defineField, defineType} from 'sanity'
import {CogIcon} from '@sanity/icons/Cog'

// Єдиний документ з налаштуваннями сайту (тексти «Про клуб» і контакти)
export default defineType({
  name: 'siteSettings',
  title: 'Налаштування сайту',
  type: 'document',
  icon: CogIcon,
  fields: [
    defineField({
      name: 'tagline',
      title: 'Слоган на головному екрані',
      type: 'string',
      validation: (rule) => rule.max(140),
    }),
    defineField({
      name: 'about',
      title: 'Про клуб',
      description: 'Абзаци розділяйте порожнім рядком',
      type: 'text',
      rows: 8,
    }),
    defineField({name: 'phone', title: 'Телефон', type: 'string'}),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (rule) => rule.email(),
    }),
    defineField({name: 'address', title: 'Адреса / Зал', type: 'string'}),
    defineField({
      name: 'instagram',
      title: 'Instagram',
      type: 'url',
      validation: (rule) => rule.uri({scheme: ['https']}),
    }),
    defineField({
      name: 'facebook',
      title: 'Facebook',
      type: 'url',
      validation: (rule) => rule.uri({scheme: ['https']}),
    }),
    defineField({
      name: 'telegram',
      title: 'Telegram',
      type: 'url',
      validation: (rule) => rule.uri({scheme: ['https']}),
    }),
  ],
  preview: {
    prepare: () => ({title: 'Налаштування сайту'}),
  },
})
