# FahrtenbuchLight v51

**AI-gestütztes Fahrtenbuch für deutsche Unternehmen**

Прогрессивное веб-приложение для ведения Fahrtenbuch (путевого журнала) в соответствии с требованиями немецкого налогового законодательства. Встроенный AI-агент на базе Claude принимает данные голосом, текстом и из фотографий чеков.

---

## Возможности

- **Fahrtenbuch** — учёт поездок с привязкой к одометру и категориям (деловые, на работу, частные)
- **KI-Assistent** — floating draggable чат с Claude: запись поездок, распознавание чеков, проверка ошибок
- **Kosten** — учёт расходов: топливо, парковка, мойка, сервис, штрафы
- **Ziele** — база партнёров, мест, маршрутов с автоподстановкой
- **Bericht** — генерация PDF Fahrtenbuch, CSV-экспорт, Google Sheets (хронологическая сортировка)
- **Dashboard** — KPI-карточки, Kosten Übersicht с количеством записей, km по категориям, km/Monat
- **Multi-Fahrzeug** — управление парком из 6 реальных автомобилей
- **3 Themes** — Carbon (default, gradients), Classic, Material
- **Cloud Sync** — Supabase backend (cloudSync.js + api/state.js)
- **Import/Export** — JSON-бэкап данных

## Стек

| Технология | Назначение |
|-----------|------------|
| React 18 | UI (single-file component) |
| Vite 6 | Сборка и dev-сервер |
| Claude API | AI-ассистент (Sonnet 4.6) |
| Vercel | Хостинг + serverless API proxy |
| Supabase | Cloud storage (state sync) |
| localStorage | Хранение данных на клиенте |

## Быстрый старт

```bash
# 1. Клонировать
git clone https://github.com/<your-username>/fahrtenbuch-light.git
cd fahrtenbuch-light

# 2. Установить зависимости
npm install

# 3. Запустить dev-сервер
npm run dev
```

Приложение откроется на `http://localhost:3000`.

> **Примечание:** AI-ассистент работает автоматически в sandbox-среде claude.ai. Для production-деплоя на Vercel необходим API-ключ.

## Деплой на Vercel

```bash
# 1. Установить Vercel CLI
npm i -g vercel

# 2. Деплой
vercel

# 3. Настроить переменные окружения в Vercel Dashboard:
#    ANTHROPIC_API_KEY = sk-ant-api03-...
#    SUPABASE_URL = https://xxx.supabase.co
#    SUPABASE_ANON_KEY = eyJ...
```

Или через GitHub-интеграцию:
1. Импортировать репозиторий в [vercel.com/new](https://vercel.com/new)
2. Framework preset → **Vite**
3. Добавить переменные в Environment Variables
4. Deploy

## Структура проекта

```
fahrtenbuch-light/
├── api/
│   ├── chat.js              # Vercel serverless — Claude API proxy
│   └── state.js             # Vercel serverless — Supabase state sync
├── docs/
│   ├── TZ_FahrtenbuchLight_v2.docx
│   ├── TZ_FahrtenbuchLight_v3.docx
│   └── TZ_FahrtenbuchLight_Full.docx
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx              # Основной компонент (~7500 строк)
│   ├── theme.js             # Три темы: Carbon, Classic, Material
│   └── main.jsx             # React entry point
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Реальные автомобили (6 шт.)

| Kennzeichen | Марка | Halter | Fahrten | Tankstellen |
|-------------|-------|--------|---------|-------------|
| TF-IA 2006 | Fiat 500e | Mirra Immobilien GmbH | 178 | — (Elektro) |
| TF-VI 601 | VW Touareg | ImmoPrim GmbH | ~165 | 40 (DKV + Visa/MC/BAR) |
| TF-AI 2006 | — | — | — | — |
| TF-IV 601 | VW Touareg R-Line | ImmoPrim GmbH | 2 | — |
| TF-KF 2128 | Nissan Qashqai | ImmoPrim GmbH | — | — |
| TF-VG 2016 | Renault Megane | ViniGrandi GmbH | — | 9 |

## DATA_VERSION = 35

Миграции (v22–v35) обеспечивают обновление данных в localStorage при каждом обновлении приложения. Ключевые миграции:

- **v22**: TF-VG 2016 — Tankstellen + Services
- **v29**: TF-VI 601 — 24 DKV-Tankstellen
- **v32**: TF-IV 601 + TF-VI 601 — 5 Strafen (Bußgeldbescheide)
- **v33**: Service betrag/rechnungsNr patch из счетов Stellantis
- **v34**: TF-IA 2006 — полная замена 178 поездок (пересчёт km-цепочки по 3 якорным точкам)
- **v35**: Переименование Werkstatt → Stellantis &You Deutschland GmbH (Fiat)

## Работа с AI-ассистентом

Встроенный KI-Chat (floating draggable cloud) поддерживает:

| Команда | Действие |
|---------|----------|
| Tanken | Записать заправку |
| Fahrt | Записать поездку |
| Service | Записать сервис |
| Parken | Записать парковку |
| Wäsche | Записать мойку |
| Strafe | Записать штраф |
| Prüfen | Проверить журнал на ошибки |
| Partner | Добавить контрагента |

Также можно отправить фотографию чека — AI распознает данные и предложит заполнить форму.

## Лицензия

MIT License — см. [LICENSE](LICENSE)

---

*FahrtenbuchLight v51 · DATA_VERSION=35 · MUSTER_VERSION=68 · Март 2026*
