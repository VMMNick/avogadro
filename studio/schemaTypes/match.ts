import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'match',
  title: 'Матчі та Результати',
  type: 'document',
  fields: [
    defineField({
      name: 'opponent',
      title: 'Назва суперника',
      type: 'string',
    }),
    defineField({
      name: 'date',
      title: 'Дата та час гри',
      type: 'datetime',
    }),
    defineField({
      name: 'location',
      title: 'Місце проведення / Зал',
      type: 'string',
    }),
    defineField({
      name: 'score',
      title: 'Рахунок (наприклад, 3:1)',
      type: 'string',
    }),
  ],
})