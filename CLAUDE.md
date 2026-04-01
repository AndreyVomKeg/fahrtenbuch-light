# CLAUDE.md — FahrtenbuchLight

> Рабочий контекст для Claude Code и Claude-сессий. Читай этот файл в начале каждой сессии.

## Что это

AI-gestütztes Fahrtenbuch (путевой журнал) для немецких компаний. React SPA + NestJS backend + PostgreSQL. Домен: **fb.deintrid.de**.

## Версии

| Константа | Значение | Назначение |
|-----------|----------|------------|
| MUSTER_VERSION | 69 | Версия демо-данных (инкремент → полная перегенерация) |
| DATA_VERSION | 67 | Версия миграций localStorage (v22–v67) |
| App.jsx | ~8000 строк | Монолитный SPA-компонент |

**КРИТИЧНО:** Не инкрементировать MUSTER_VERSION без крайней необходимости — это стирает пользовательские правки в демо-режиме.

## Архитектура

```
Браузер → fb.deintrid.de → trid-nginx (reverse proxy)
                              ├── /api/*  → fb-backend:3002  (NestJS)
                              └── /*      → fb-frontend:80   (Nginx + SPA)

fb-backend → PostgreSQL (trid-lager-erp_default network, общая БД)
fb-backend → fb-redis:6379 (кеш)
fb-backend → fb-whisper (Faster Whisper STT)
fb-backend → Anthropic API (Claude, внешний)
```

## Сервер

| Параметр | Значение |
|----------|----------|
| IP | 188.245.211.221 |
| SSH порт | 2222 |
| SSH user | deploy |
| Проект на сервере | /opt/fahrtenbuch |
| Домен | fb.deintrid.de |
| Docker network | trid-lager-erp_default (external, shared) |

## Контейнеры

| Контейнер | Образ | Порт | Назначение |
|-----------|-------|------|------------|
| fb-backend | ./backend (Dockerfile) | 3002 | NestJS API, Prisma ORM, Puppeteer PDF |
| fb-frontend | ./frontend (Dockerfile) | 80 | Vite SPA build → Nginx static |
| fb-redis | redis:7-alpine | 6379 | Кеш сессий |
| fb-whisper | fedirz/faster-whisper-server | — | Speech-to-text |
| trid-nginx | Внешний | 80 | Reverse proxy, SSL termination |

## Структура проекта

```
fahrtenbuch-light/
├── src/                  ← ФРОНТЕНД (React SPA)
│   ├── App.jsx           ← Основной файл (~8000 строк, монолит)
│   ├── theme.js          ← Темы и цвета
│   ├── main.jsx          ← Точка входа
│   └── lib/
│       └── apiClient.js  ← API клиент (все эндпоинты)
├── backend/              ← БЭКЕНД (NestJS 11)
│   ├── prisma/
│   │   └── schema.prisma ← Схема БД (все модели)
│   └── src/
│       ├── fahrzeuge/    ← CRUD машин
│       ├── fahrten/      ← CRUD поездок
│       ├── tankstellen/  ← CRUD заправок
│       ├── strafen/      ← CRUD штрафов
│       ├── partner/      ← CRUD партнёров
│       ├── standorte/    ← CRUD стандортов
│       ├── messen/       ← CRUD мессен
│       ├── parken/       ← CRUD парковок
│       ├── waesche/      ← CRUD моек
│       ├── service-records/ ← CRUD сервисов
│       ├── dashboard/    ← Агрегация для дашборда
│       ├── auth/         ← JWT auth + demo mode
│       ├── agent/        ← AI-ассистент (Contour A)
│       │   └── dev-agent/ ← Dev-Agent (Contour B)
│       ├── audit/        ← Аудит-лог
│       ├── export/       ← PDF/CSV экспорт
│       ├── beleg-scan/   ← Сканирование чеков
│       ├── whisper/      ← Speech-to-text proxy
│       ├── s3/           ← Hetzner S3 storage
│       ├── settings/     ← AppSettings (API ключи)
│       ├── i18n/         ← Локализация (DE/EN/RU)
│       └── health/       ← Healthcheck
├── frontend/
│   ├── Dockerfile        ← Multi-stage: node build → nginx
│   └── nginx.conf        ← Gzip, cache, SPA fallback
├── nginx/
│   └── fb.conf           ← trid-nginx reverse proxy config
├── docker-compose.yml    ← Все сервисы
├── deploy.sh             ← Деплой на сервер (rsync + docker build)
├── docs/
│   ├── Deploy_Context.md ← Полный контекст деплоя (эталон)
│   └── SKILL_FAHRTENBUCH.md ← Методология генерации Fahrtenbuch
├── .env                  ← Переменные (НЕ синкается, только на сервере)
└── index.html            ← HTML entry point
```

## Что я могу редактировать

### Можно делать самостоятельно:
1. **Редактировать фронтенд** — `src/App.jsx`, `src/theme.js`, `src/lib/apiClient.js`
2. **Менять мок-данные** — seed data в `src/App.jsx` (фабрики машин и inline данные)
3. **Менять стили/темы** — `src/theme.js`
4. **Добавлять/менять данные через API** — использовать REST endpoints
5. **Деплоить фронтенд** — `bash deploy.sh`
6. **Обновлять CLAUDE.md и README.md**

### Нужно передать разработчику:
Если изменения касаются **бэкенда** (`backend/`), **схемы БД** (`prisma/schema.prisma`), **Docker конфигурации**, **nginx**, или **переменных окружения**:

1. Создать файл `BACKEND_CHANGE_REQUEST.md` с описанием:
   - Что нужно изменить и зачем
   - Какие файлы затронуты
   - Какие новые эндпоинты/модели нужны
2. Добавить приписку:

> **Это изменение требует доработки бэкенда.**
> Скиньте этот файл вашему разработчику для реализации.

### Важные ограничения:
- `.env` файл **только на сервере** — НЕ коммитить, НЕ включать в rsync
- Backend собирается из TypeScript (`npm run build`) — нельзя редактировать `dist/` напрямую
- `docker compose down` убивает контейнеры, но **БД на внешнем PostgreSQL** — данные НЕ теряются
- Frontend — монолитный SPA, `src/App.jsx` ~8000 строк — все компоненты в одном файле
- JWT access token живёт 15 минут, refresh token 7 дней

## 8 реальных машин

| Kennzeichen | Фабрика | Halter | Fahrten | Tankst. | EZ |
|-------------|---------|--------|---------|---------|-----|
| TF-IA 2006 | makeFiatDefault | Mirra Immobilien | 153 | 0 (E-Auto) | 11.10.2022 |
| TF-VI 601 | makeVWDefault | ImmoPrim | ~165 | 40 | 07.05.2024 |
| TF-AI 2006 | makeTFAIDefault | — | 0 | 0 | 30.10.2025 |
| TF-IV 601 | makeTouaregDefault | ImmoPrim | 2 | 0 | 28.11.2025 |
| TF-KF 2128 | makeNissanDefault | ImmoPrim | 55 | 0 | 12.01.2023 |
| TF-VG 2016 | makeRenaultDefault | ViniGrandi | 0 | 9 | 22.06.2018 |
| TF-LT 95 | makeClioDefault | TRID GmbH | 0 | 0 | 08.06.2006 |
| TF-TR 6666 | makeCapturDefault | TRID GmbH | 0 | 9 | 26.07.2013 |

### Jahresabschluss (заморозка годов)
Структура: `jahresAbschluss: { "2024": { kmEnde: "12794", datum: "27.12.2024", gesperrt: true, fahrten: 52 } }`

Замороженные годы: поездки скрыты из списка Fahrten, показан сепаратор с кнопкой Entsperren.
Незамороженные: все поездки видны, сепаратор с кнопкой Abschließen.
При генерации: `jahresAbschluss.kmEnde` = стартовый km для следующего года. Поездки замороженных годов НИКОГДА не модифицируются.

## Система миграций

Данные хранятся в localStorage (`fb2_real`). При каждом открытии:
1. Загрузить из localStorage
2. Сравнить `_dataVersion` с `DATA_VERSION`
3. Применить пропущенные миграции (v22→v67)
4. Сохранить обновлённые данные

**Добавление миграции:**
```javascript
// В массиве DATA_MIGRATIONS перед ];
{ v:68, run: fzs => fzs.map(f => {
  if(f.kennzeichen !== "TF-XX NNNN") return f;
  // ... изменения ...
  return {...f, /* patched fields */};
}) },
```

**Правило:** Фабрика = данные для новых пользователей. Миграция = патч для существующих пользователей. Всегда добавляй оба.

## Km-цепочка (Odometer Chain)

TF-IA 2006 пересчитана по 3 якорным точкам из реальных счетов Stellantis:
- Start: 4831 km
- 18.04.2024: 5971 km (1. Jahreswartung)
- 13.05.2025: 11446 km (2. Jahreswartung)
- 04.11.2025: 13912 km (3. Inspektion)

Каждая поездка: `kmEnd[n] === kmStart[n+1]`. Нулевых разрывов. При добавлении/удалении поездок — пересчитывать всю цепочку.

Расстояния рассчитываются через Claude API (estimateKm). Google Maps API НЕ используется.

## Сборка

```bash
# build-all.sh делает:
# 1. node --check src/App.jsx (парсинг)
# 2. Inline theme.js → FahrtenbuchLight_v52.jsx (артефакт для claude.ai)
# 3. npm run build (Vite production build)
# 4. zip → fahrtenbuch-light.zip (репозиторий)

bash build-all.sh
```

Выходные файлы:
- `/mnt/user-data/outputs/FahrtenbuchLight_v52.jsx` — артефакт (preview в claude.ai)
- `/mnt/user-data/outputs/fahrtenbuch-light.zip` — zip с App.jsx + theme.js + все файлы

## Деплой

### Полный деплой (фронтенд + бэкенд)
```bash
cd fahrtenbuch-light
bash deploy.sh
```
Скрипт делает: rsync → docker compose build --no-cache → docker compose up -d → копирует nginx config → reload nginx

### Только фронтенд (быстрее)
Если изменился только `src/App.jsx` или `src/theme.js`:
```bash
bash deploy.sh
# Docker пересоберёт только fb-frontend (кеш слоёв)
```

### Только бэкенд
Если изменились файлы в `backend/src/`:
```bash
bash deploy.sh
# Docker пересоберёт fb-backend
```

### Миграции БД
Prisma миграции применяются автоматически при старте контейнера (`npx prisma db push --skip-generate` в CMD).

## API Endpoints (REST)

Все эндпоинты требуют JWT (`Authorization: Bearer <token>`), кроме auth.

### Auth
```
POST /api/auth/register    {email, password, name}
POST /api/auth/login       {email, password}        → {accessToken, refreshToken, user}
POST /api/auth/refresh     {refreshToken}            → {accessToken, refreshToken}
POST /api/auth/demo        (без тела)               → {accessToken, refreshToken, user}
```

### CRUD (одинаковый паттерн для всех сущностей)
```
GET    /api/{resource}?fahrzeugId=UUID    → массив записей
POST   /api/{resource}                    → создание
PATCH  /api/{resource}/:id                → обновление
DELETE /api/{resource}/:id                → удаление
```

**Ресурсы:** `fahrzeuge`, `fahrten`, `tankstellen`, `parken`, `waesche`, `service-records`, `strafen`, `partner`, `standorte`, `messen`

**Важно:** `fahrzeuge` — без `?fahrzeugId`, все остальные — с `?fahrzeugId=UUID`

### Dashboard
```
GET /api/dashboard?fahrzeugId=UUID            → агрегированная статистика
GET /api/dashboard/km-monat?fahrzeugId=UUID   → км по месяцам
```

### Settings (Admin only)
```
GET /api/settings                         → все настройки
GET /api/settings/:key                    → одна настройка
PUT /api/settings/:key    {value}         → установить
DELETE /api/settings/:key                 → удалить
```

### Agent (AI Chat)
```
POST /api/agent/chat      {sessionId?, message, images?, fahrzeugId}  → SSE stream
GET  /api/agent/sessions                  → список сессий
POST /api/agent/sessions                  → новая сессия
GET  /api/agent/sessions/:id/messages     → сообщения сессии
DELETE /api/agent/sessions/:id            → удалить сессию
```

### Dev-Agent (Contour B, Admin only)
```
POST /api/agent/dev/chat  {sessionId?, message}  → SSE stream
GET  /api/agent/dev/edits?page=1&limit=20        → список правок
POST /api/agent/dev/edits/:id/apply              → применить правку
POST /api/agent/dev/edits/:id/rollback           → откатить правку
```

### Export
```
GET /api/fahrtenbuch/export?fahrzeugId=UUID&format=pdf|csv|tsv
```

## База данных (Prisma Schema)

**Подключение:** `DATABASE_URL` в `.env` на сервере

Основные модели:
- `User` — пользователи (email, role: ADMIN|BENUTZER)
- `Fahrzeug` — машины (привязаны к User)
- `Fahrt` — поездки (привязаны к Fahrzeug)
- `Tankstelle` — заправки
- `Parken` — парковки
- `Waesche` — мойки
- `Service` — сервисные записи
- `Strafe` — штрафы
- `Partner` — партнёры (типы: KUNDE, MIETER, MAKLER и др.)
- `Standort` — стандорты (типы: WERKSTATT, POST, BANK и др.)
- `Messe` — мессы/выставки
- `AppSetting` — настройки приложения (API ключи)
- `ChatSession` / `ChatMessage` — чат сессии агента
- `AgentEdit` — правки Dev-Agent
- `AuditLog` — лог действий

## Соглашения по коду

- **Язык UI:** немецкий (Fahrt, Tankstelle, Wäsche, Strafe, Parken)
- **Язык комментариев:** русский / английский
- **Шрифт:** Inter (Google Fonts)
- **CSS:** inline styles, не CSS-файлы. Цвета из `C` объекта (theme)
- **Компоненты:** function components + hooks, всё в одном файле
- **ID:** `uid()` — генерация уникальных ID
- **Числа:** `safeFloat(v)` — безопасный parseFloat
- **Даты:** `formatDatum(d)` — DD.MM.YYYY
- **Сортировка UI:** новое сверху (b→a). PDF/CSV: хронологическая (a→b)
- **Иконки:** `<Ico name="..." />` — SVG inline
- **Формы:** `<F label="..." />`, `<LS label="..." />`, `<FormRow>`, `<FormPanel>`

## Учётные данные для тестирования

```
Admin:    Admin@deintrid.de / Admin2026!fb
Demo:     POST /api/auth/demo (автоматический временный аккаунт, 2 часа)
```

## Переменные окружения (.env на сервере)

```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
ANTHROPIC_API_KEY=sk-ant-... (или через Settings UI)
S3_ENDPOINT=... (Hetzner Object Storage, опционально)
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_BUCKET=...
```

## Документация

- `docs/Deploy_Context.md` — полный контекст деплоя (эталон)
- `docs/SKILL_FAHRTENBUCH.md` — методология генерации Fahrtenbuch (с YAML frontmatter)
- `docs/TZ_FahrtenbuchLight_*.docx` — технические задания
- `README.md` — общая документация проекта

---

*Обновлено: Март 2026 · v52 · DATA_VERSION=67 · MUSTER_VERSION=69 · 8 машин*
