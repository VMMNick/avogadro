# ВК «Лавина» — офіційний сайт

Статичний сайт волейбольного клубу (HTML/CSS/JS) з контентом із **Sanity.io**.

| Частина | Де живе | Адреса |
|---|---|---|
| Сайт | корінь репозиторію → Vercel | https://avohadro.vercel.app |
| Адмінка (Sanity Studio) | `studio/` → Sanity hosting | https://avohadro.sanity.studio |

## Структура

```text
index.html            головна сторінка (Про клуб, Склад, Матчі, Контакти)
css/style.css         стилі
js/main.js            один GROQ-запит до Sanity CDN + рендер
images/               заглушка фото гравця, favicon
studio/               Sanity Studio (схеми player, match, siteSettings)
```

## Локальний запуск

```bash
# сайт — будь-який статичний сервер, напр. Live Server у VS Code (порт 5500)
npx serve .

# адмінка
cd studio
npm install
npm run dev        # http://localhost:3333
```

## Деплой

- **Сайт:** push у `main` → Vercel деплоїть автоматично. Папка `studio/` виключена через `.vercelignore`.
- **Studio:** `cd studio && npm run deploy`.

## Важливо для роботи з даними

- Сайт бачить лише **опубліковані** документи (кнопка *Publish* у Studio). Чернетки публічний API не віддає.
- Датасет `production` має бути **Public** (manage.sanity.io → Datasets), бо сайт читає дані без токена.
- У manage.sanity.io → API → CORS Origins мають бути домени сайту (`https://avohadro.vercel.app`, `http://localhost:5500`).
- Тексти «Про клуб», слоган і контакти редагуються в Studio → **Налаштування сайту**.
