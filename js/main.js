'use strict';

// ---------- Налаштування Sanity ----------
const SANITY = {
  projectId: '26imwxcy',
  dataset: 'production',
  apiVersion: '2025-02-19',
};

// Один GROQ-запит забирає все, що потрібно сторінці
const QUERY = `{
  "players": *[_type == "player" && !(_id in path("drafts.**"))] | order(coalesce(number, 999) asc, title asc) {
    _id, title, number, role, "image": image.asset->url
  },
  "matches": *[_type == "match" && defined(date) && !(_id in path("drafts.**"))] | order(date asc) {
    _id, opponent, date, location, score
  },
  "settings": *[_type == "siteSettings" && _id == "siteSettings"][0] {
    tagline, about, phone, email, address, instagram, facebook, telegram
  }
}`;

const PLACEHOLDER_IMAGE = 'images/default-player.svg';

const ROLES = {
  setter: "Зв'язуючий",
  spiker: 'Догравальник',
  middle: 'Центральний блокуючий',
  opposite: 'Діагональний',
  libero: 'Ліберо',
  staff: 'Тренерський штаб',
};

// ---------- Утиліти ----------
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Дозволяємо лише http(s)-посилання, щоб у href не потрапив javascript:
function safeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

function sanityImage(url, width, height) {
  if (!url) return PLACEHOLDER_IMAGE;
  const params = new URLSearchParams({ w: width, h: height, fit: 'crop', auto: 'format' });
  return `${url}?${params}`;
}

const dateFormatter = new Intl.DateTimeFormat('uk-UA', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Kyiv',
});

function formatDate(iso) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date);
}

function stateMessage(text, isError = false) {
  return `<p class="state-message${isError ? ' is-error' : ''}">${escapeHtml(text)}</p>`;
}

// ---------- Завантаження ----------
async function fetchContent() {
  const { projectId, dataset, apiVersion } = SANITY;
  const url = `https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(QUERY)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sanity API відповів ${res.status}`);
  const data = await res.json();
  return data.result || {};
}

// ---------- Гравці ----------
let activeRole = 'all';

function renderPlayers(players) {
  const grid = document.getElementById('team-grid');
  if (!grid) return;

  if (!players.length) {
    grid.innerHTML = stateMessage('Склад команди ще не додано.');
    return;
  }

  grid.innerHTML = players
    .map((player) => {
      const role = ROLES[player.role] ? player.role : 'other';
      const name = escapeHtml(player.title || 'Без імені');
      const number = Number.isFinite(player.number) ? `#${player.number}` : '';
      return `
        <article class="player-card" data-role="${role}">
          <div class="player-photo">
            <img src="${escapeHtml(sanityImage(player.image, 480, 640))}" alt="${name}" loading="lazy" width="480" height="640">
            ${number ? `<span class="player-number">${number}</span>` : ''}
          </div>
          <div class="player-info">
            <h3>${name}</h3>
            <p class="player-role">${escapeHtml(ROLES[player.role] || 'Гравець')}</p>
          </div>
        </article>`;
    })
    .join('');

  applyFilter();
}

function applyFilter() {
  const cards = document.querySelectorAll('.player-card');
  let visible = 0;
  cards.forEach((card) => {
    const show = activeRole === 'all' || card.dataset.role === activeRole;
    card.hidden = !show;
    if (show) visible += 1;
  });

  const grid = document.getElementById('team-grid');
  const empty = grid?.querySelector('.filter-empty');
  if (cards.length && !visible && !empty) {
    grid.insertAdjacentHTML('beforeend', '<p class="state-message filter-empty">У цій категорії поки нікого немає.</p>');
  } else if (visible && empty) {
    empty.remove();
  }
}

function setupFilters() {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-pressed', String(b === btn));
      });
      activeRole = btn.dataset.role;
      applyFilter();
    });
  });
}

// ---------- Матчі ----------
function matchCard(match, isPast) {
  const score = isPast && match.score ? `<span class="match-score">${escapeHtml(match.score)}</span>` : '';
  return `
    <article class="match-card${isPast ? ' is-past' : ''}">
      <div class="match-date">${escapeHtml(formatDate(match.date))}</div>
      <div class="teams-vs">
        <span class="team-title">Лавина</span>
        ${score || '<span class="vs-badge">VS</span>'}
        <span class="team-title">${escapeHtml(match.opponent || 'Суперник уточнюється')}</span>
      </div>
      ${match.location ? `<div class="match-location">📍 ${escapeHtml(match.location)}</div>` : ''}
    </article>`;
}

function renderMatches(matches) {
  const upcomingEl = document.getElementById('upcoming-matches');
  const pastEl = document.getElementById('past-matches');
  if (!upcomingEl || !pastEl) return;

  const now = Date.now();
  // Гра вважається зіграною, якщо є рахунок або вона почалась понад 3 години тому
  const isPast = (m) => Boolean(m.score) || new Date(m.date).getTime() < now - 3 * 60 * 60 * 1000;

  const upcoming = matches.filter((m) => !isPast(m)).slice(0, 6);
  const past = matches.filter(isPast).reverse().slice(0, 6);

  upcomingEl.innerHTML = upcoming.length
    ? upcoming.map((m) => matchCard(m, false)).join('')
    : stateMessage('Найближчих ігор поки не заплановано.');

  pastEl.innerHTML = past.length
    ? past.map((m) => matchCard(m, true)).join('')
    : stateMessage('Результатів ще немає.');
}

// ---------- Про клуб і контакти ----------
function renderSettings(settings) {
  if (!settings) return;

  if (settings.tagline) document.getElementById('hero-tagline').textContent = settings.tagline;
  if (settings.about) {
    const about = document.getElementById('about-text');
    about.innerHTML = settings.about
      .split(/\n{2,}/)
      .map((p) => `<p>${escapeHtml(p.trim()).replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  const items = [];
  if (settings.phone) {
    const tel = settings.phone.replace(/[^\d+]/g, '');
    items.push(['Телефон', `<a href="tel:${escapeHtml(tel)}">${escapeHtml(settings.phone)}</a>`]);
  }
  if (settings.email) {
    items.push(['Email', `<a href="mailto:${escapeHtml(settings.email)}">${escapeHtml(settings.email)}</a>`]);
  }
  if (settings.address) items.push(['Адреса', escapeHtml(settings.address)]);

  const socials = [
    ['Instagram', settings.instagram],
    ['Facebook', settings.facebook],
    ['Telegram', settings.telegram],
  ]
    .map(([label, url]) => [label, safeUrl(url)])
    .filter(([, url]) => url)
    .map(([label, url]) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${label}</a>`);
  if (socials.length) items.push(['Соцмережі', socials.join(' · ')]);

  if (items.length) {
    document.getElementById('contacts-grid').innerHTML = items
      .map(([label, value]) => `
        <div class="contact-card">
          <span class="contact-label">${label}</span>
          <span class="contact-value">${value}</span>
        </div>`)
      .join('');
  }
}

// ---------- Мобільне меню ----------
function setupNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
}

// ---------- Старт ----------
document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('year').textContent = new Date().getFullYear();
  setupNav();
  setupFilters();

  try {
    const { players = [], matches = [], settings = null } = await fetchContent();
    renderPlayers(players);
    renderMatches(matches);
    renderSettings(settings);
  } catch (err) {
    console.error('Помилка завантаження даних із Sanity:', err);
    const msg = stateMessage('Не вдалося завантажити дані. Спробуйте оновити сторінку.', true);
    document.getElementById('team-grid').innerHTML = msg;
    document.getElementById('upcoming-matches').innerHTML = msg;
    document.getElementById('past-matches').innerHTML = msg;
  }
});
