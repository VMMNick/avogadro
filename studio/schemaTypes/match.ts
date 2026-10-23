import {defineField, defineType} from 'sanity'
import {CalendarIcon} from '@sanity/icons/Calendar'

export default defineType({
  name: 'match',
  title: 'Матчі та Результати',
  type: 'document',
  icon: CalendarIcon,
  fields: [
    defineField({
      name: 'opponent',
      title: 'Назва суперника',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Дата та час гри',
      type: 'datetime',
      options: {dateFormat: 'DD.MM.YYYY', timeFormat: 'HH:mm', timeStep: 15},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'location',
      title: 'Місце проведення / Зал',
      type: 'string',
    }),
    defineField({
      name: 'score',
      title: 'Рахунок',
      description: 'Заповнюється після гри, наприклад 3:1 (спершу сети «Лавини»)',
      type: 'string',
      validation: (rule) =>
        rule.regex(/^[0-3]:[0-3]$/, {name: 'рахунок у форматі 3:1'}).error('Формат: 3:1'),
    }),
  ],
  orderings: [
    {title: 'Спершу нові', name: 'dateDesc', by: [{field: 'date', direction: 'desc'}]},
    {title: 'Спершу старі', name: 'dateAsc', by: [{field: 'date', direction: 'asc'}]},
  ],
  initialValue: {location: ''},
  preview: {
    select: {opponent: 'opponent', date: 'date', score: 'score'},
    prepare({opponent, date, score}) {
      const when = date
        ? new Date(date).toLocaleString('uk-UA', {dateStyle: 'medium', timeStyle: 'short'})
        : 'Дата не вказана'
      return {
        title: `Лавина — ${opponent ?? '?'}`,
        subtitle: score ? `${when} · ${score}` : when,
      }
    },
  },
})
