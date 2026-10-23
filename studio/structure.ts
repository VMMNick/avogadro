import type {StructureResolver} from 'sanity/structure'
import {CogIcon} from '@sanity/icons/Cog'

export const SINGLETON_TYPES = new Set(['siteSettings'])

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Контент')
    .items([
      S.listItem()
        .title('Налаштування сайту')
        .id('siteSettings')
        .icon(CogIcon)
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      S.divider(),
      S.documentTypeListItem('player').title('Гравці та Штаб'),
      S.documentTypeListItem('match').title('Матчі та Результати'),
    ])
