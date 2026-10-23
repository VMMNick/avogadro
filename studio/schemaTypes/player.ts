import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'player',
  title: 'Гравці та Штаб',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: "ПІБ / Ім'я",
      type: 'string',
    }),
    defineField({
      name: 'number',
      title: 'Ігровий номер',
      type: 'number',
    }),
    defineField({
      name: 'role',
      title: 'Амплуа',
      type: 'string',
      options: {
        list: [
          { title: "Зв'язуючий", value: 'setter' },
          { title: 'Догравальник', value: 'spiker' },
          { title: 'Центральний блокуючий', value: 'middle' },
          { title: 'Діагональний', value: 'opposite' },
          { title: 'Ліберо', value: 'libero' },
        ],
      },
    }),
    defineField({
      name: 'image',
      title: 'Фото гравця',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
  ],
})