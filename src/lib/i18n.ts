import type { PlayerRole } from '@/db/schema'

export const LOCALES = ['uk', 'en'] as const
export type Locale = (typeof LOCALES)[number]

/** Префікс шляхів: українська — корінь сайту, англійська — /en. */
export const localePrefix = (locale: Locale) => (locale === 'en' ? '/en' : '')

const uk = {
  htmlLang: 'uk',
  intl: 'uk-UA',
  ogLocale: 'uk_UA',
  clubName: 'Авогадро',
  clubFull: 'ВК «Авогадро»',
  siteTitle: 'ВК Авогадро — Офіційний сайт волейбольного клубу',
  siteDescription:
    'Офіційний сайт волейбольного клубу «Авогадро»: склад команди, розклад і результати матчів, статистика, контакти.',
  skipLink: 'Перейти до вмісту',
  logoLabel: 'ВК Авогадро — на початок сторінки',
  logoSub: 'Волейбольний клуб',
  nav: {
    about: 'Про клуб',
    team: 'Склад',
    matches: 'Матчі',
    stats: 'Статистика',
    contacts: 'Контакти',
  },
  menuOpen: 'Відкрити меню',
  menuClose: 'Закрити меню',
  mainMenu: 'Головне меню',
  langSwitch: { label: 'Мова сайту', other: 'EN', otherFull: 'English' },
  hero: {
    kicker: 'Волейбольний клуб',
    tagline: 'Сила, характер та жага до перемоги на кожному майданчику.',
    ctaMatches: 'Найближчі матчі',
    ctaTeam: 'Склад команди',
  },
  about: {
    title: 'Про клуб',
    text: "Волейбольний клуб «Авогадро» — команда, яка об'єднує людей, що люблять волейбол. Ми тренуємося, граємо в чемпіонатах і турнірах та запрошуємо всіх уболівати за нас.",
  },
  team: {
    title: 'Склад команди',
    filterLabel: 'Фільтр за амплуа',
    empty: 'Склад команди ще не додано.',
    emptyRole: 'У цій категорії поки нікого немає.',
    loadError: 'Не вдалося завантажити дані. Спробуйте пізніше.',
  },
  roles: {
    setter: "Зв'язуючий",
    spiker: 'Догравальник',
    middle: 'Центральний блокуючий',
    opposite: 'Діагональний',
    libero: 'Ліберо',
    staff: 'Тренерський штаб',
  } satisfies Record<PlayerRole, string>,
  roleFilters: {
    all: 'Усі',
    setter: "Зв'язуючі",
    spiker: 'Догравальники',
    middle: 'Центральні',
    opposite: 'Діагональні',
    libero: 'Ліберо',
    staff: 'Штаб',
  } satisfies Record<PlayerRole | 'all', string>,
  matches: {
    title: 'Матчі',
    kindLabel: 'Тип матчів',
    kinds: { all: 'Усі', official: 'Офіційні', friendly: 'Товариські' },
    friendlyBadge: 'Товариська',
    season: 'Сезон',
    allSeasons: 'Усі сезони',
    tournament: 'Турнір',
    allTournaments: 'Усі турніри',
    upcoming: 'Найближчі ігри',
    results: 'Результати',
    noUpcoming: 'Найближчих ігор за цими умовами поки не заплановано.',
    noResults: 'Результатів за цими умовами ще немає.',
    showMore: 'Показати ще',
    details: 'Детальніше',
    addToCalendar: 'У календар',
    vs: 'VS',
  },
  calendar: {
    title: 'Календар матчів',
    text: 'Підпишіться — і всі ігри клубу самі з’являтимуться у вашому календарі, з оновленнями часу й результатів.',
    google: 'Google Календар',
    apple: 'Apple / Outlook',
    copy: 'Скопіювати посилання',
    copied: 'Скопійовано',
    eventGoogle: 'Додати в Google Календар',
    eventIcs: 'Завантажити подію (.ics)',
  },
  stats: {
    title: 'Статистика',
    note: 'За зіграними матчами з рахунком.',
    played: 'Ігор',
    wins: 'Перемог',
    losses: 'Поразок',
    winRate: 'Перемог, %',
    sets: 'Сети',
    streak: 'Серія',
    streakWin: (n: number) => `${n} ${plural(n, 'перемога', 'перемоги', 'перемог')} поспіль`,
    streakLoss: (n: number) => `${n} ${plural(n, 'поразка', 'поразки', 'поразок')} поспіль`,
    form: 'Форма',
    formWin: 'П',
    formLoss: 'П',
    formWinTitle: 'Перемога',
    formLossTitle: 'Поразка',
    empty: 'Поки немає зіграних матчів із рахунком.',
    h2hTitle: 'Особисті зустрічі',
    h2hPick: 'Оберіть суперника',
    h2hRecord: (w: number, l: number) => `${w} ${plural(w, 'перемога', 'перемоги', 'перемог')} · ${l} ${plural(l, 'поразка', 'поразки', 'поразок')}`,
    h2hSets: 'Сети',
    h2hEmpty: 'З цим суперником ще не грали.',
  },
  contacts: {
    title: 'Контакти',
    phone: 'Телефон',
    email: 'Email',
    address: 'Адреса',
    socials: 'Соцмережі',
    soon: 'Контакти з’являться незабаром.',
  },
  map: {
    hall: 'Зал команди',
    open: 'Відкрити в Google Maps',
    directions: 'Прокласти маршрут',
    title: (place: string) => `Карта: ${place}`,
  },
  footer: { rights: 'Усі права захищено.' },
  detail: {
    back: '← До всіх матчів',
    played: 'Матч зіграно',
    upcoming: 'Майбутній матч',
    venue: 'Місце',
    date: 'Дата',
    tournament: 'Турнір',
    season: 'Сезон',
    share: 'Поділитися',
    copied: 'Посилання скопійовано',
    h2h: 'Усі зустрічі з цим суперником',
    noH2h: 'Інших зустрічей із цим суперником ще не було.',
    openMap: 'Відкрити на карті',
  },
  win: 'Перемога',
  loss: 'Поразка',
}

export type Dict = typeof uk

const en: Dict = {
  htmlLang: 'en',
  intl: 'en-GB',
  ogLocale: 'en_US',
  clubName: 'Avogadro',
  clubFull: 'Avogadro Volleyball Club',
  siteTitle: 'Avogadro Volleyball Club — Official website',
  siteDescription:
    'Official website of Avogadro volleyball club: team roster, fixtures and results, statistics, contacts.',
  skipLink: 'Skip to content',
  logoLabel: 'Avogadro Volleyball Club — back to top',
  logoSub: 'Volleyball club',
  nav: {
    about: 'About',
    team: 'Team',
    matches: 'Matches',
    stats: 'Stats',
    contacts: 'Contacts',
  },
  menuOpen: 'Open menu',
  menuClose: 'Close menu',
  mainMenu: 'Main menu',
  langSwitch: { label: 'Site language', other: 'UA', otherFull: 'Українська' },
  hero: {
    kicker: 'Volleyball club',
    tagline: 'Strength, character and the will to win on every court.',
    ctaMatches: 'Upcoming matches',
    ctaTeam: 'Our team',
  },
  about: {
    title: 'About the club',
    text: 'Avogadro is a volleyball club that brings together people who love the game. We train, play in championships and tournaments, and invite everyone to support us.',
  },
  team: {
    title: 'Team roster',
    filterLabel: 'Filter by position',
    empty: 'The roster has not been added yet.',
    emptyRole: 'No one in this category yet.',
    loadError: 'Could not load data. Please try again later.',
  },
  roles: {
    setter: 'Setter',
    spiker: 'Outside hitter',
    middle: 'Middle blocker',
    opposite: 'Opposite',
    libero: 'Libero',
    staff: 'Coaching staff',
  },
  roleFilters: {
    all: 'All',
    setter: 'Setters',
    spiker: 'Outside hitters',
    middle: 'Middles',
    opposite: 'Opposites',
    libero: 'Liberos',
    staff: 'Staff',
  },
  matches: {
    title: 'Matches',
    kindLabel: 'Match type',
    kinds: { all: 'All', official: 'Official', friendly: 'Friendly' },
    friendlyBadge: 'Friendly',
    season: 'Season',
    allSeasons: 'All seasons',
    tournament: 'Competition',
    allTournaments: 'All competitions',
    upcoming: 'Upcoming',
    results: 'Results',
    noUpcoming: 'No upcoming matches for this selection yet.',
    noResults: 'No results for this selection yet.',
    showMore: 'Show more',
    details: 'Details',
    addToCalendar: 'Add to calendar',
    vs: 'VS',
  },
  calendar: {
    title: 'Match calendar',
    text: 'Subscribe and every club match will appear in your calendar automatically, including time changes and results.',
    google: 'Google Calendar',
    apple: 'Apple / Outlook',
    copy: 'Copy link',
    copied: 'Copied',
    eventGoogle: 'Add to Google Calendar',
    eventIcs: 'Download event (.ics)',
  },
  stats: {
    title: 'Statistics',
    note: 'Based on played matches with a score.',
    played: 'Played',
    wins: 'Wins',
    losses: 'Losses',
    winRate: 'Win rate, %',
    sets: 'Sets',
    streak: 'Streak',
    streakWin: (n: number) => `${n} ${n === 1 ? 'win' : 'wins'} in a row`,
    streakLoss: (n: number) => `${n} ${n === 1 ? 'loss' : 'losses'} in a row`,
    form: 'Form',
    formWin: 'W',
    formLoss: 'L',
    formWinTitle: 'Win',
    formLossTitle: 'Loss',
    empty: 'No played matches with a score yet.',
    h2hTitle: 'Head to head',
    h2hPick: 'Choose an opponent',
    h2hRecord: (w: number, l: number) => `${w} ${w === 1 ? 'win' : 'wins'} · ${l} ${l === 1 ? 'loss' : 'losses'}`,
    h2hSets: 'Sets',
    h2hEmpty: 'No matches against this opponent yet.',
  },
  contacts: {
    title: 'Contacts',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    socials: 'Social media',
    soon: 'Contacts coming soon.',
  },
  map: {
    hall: 'Home venue',
    open: 'Open in Google Maps',
    directions: 'Get directions',
    title: (place: string) => `Map: ${place}`,
  },
  footer: { rights: 'All rights reserved.' },
  detail: {
    back: '← All matches',
    played: 'Match played',
    upcoming: 'Upcoming match',
    venue: 'Venue',
    date: 'Date',
    tournament: 'Competition',
    season: 'Season',
    share: 'Share',
    copied: 'Link copied',
    h2h: 'All matches against this opponent',
    noH2h: 'No other matches against this opponent yet.',
    openMap: 'Open map',
  },
  win: 'Win',
  loss: 'Loss',
}

// «Перемога» і «Поразка» українською починаються з тієї ж літери — розрізняємо кольором і підказкою
uk.stats.formWin = 'В'
uk.stats.formLoss = 'П'

export const DICTS: Record<Locale, Dict> = { uk, en }
export const getDict = (locale: Locale) => DICTS[locale]

/** Українські відмінки числівників: 1 перемога, 2 перемоги, 5 перемог. */
export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}

/** Дата й час матчу за київським часом у потрібній мові. */
export function formatMatchDate(iso: string | Date, locale: Locale) {
  return new Intl.DateTimeFormat(DICTS[locale].intl, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Kyiv',
  }).format(new Date(iso))
}
