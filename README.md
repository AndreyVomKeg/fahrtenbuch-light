# fahrtenbuch-light[README.md](https://github.com/user-attachments/files/26042287/README.md)
# FahrtenbuchLight v42

**AI-gestütztes Fahrtenbuch für deutsche Unternehmen**

Прогрессивное веб-приложение для ведения Fahrtenbuch (путевого журнала) в соответствии с требованиями немецкого налогового законодательства. Встроенный AI-агент на базе Claude принимает данные голосом, текстом и из фотографий чеков.

---

## Возможности

- **Fahrtenbuch** — учёт поездок с привязкой к одометру и категориям (деловые, на работу, частные)
- **KI-Assistent** — чат с Claude: запись поездок, распознавание чеков, проверка ошибок
- **Kosten** — учёт расходов: топливо, парковка, мойка, сервис, штрафы
- **Ziele** — база партнёров, мест, маршрутов с автоподстановкой
- **PDF-Bericht** — генерация официального отчёта для налоговой
- **Multi-Fahrzeug** — управление парком автомобилей
- **Import/Export** — JSON-бэкап данных

## Стек

| Технология | Назначение |
|-----------|------------|
| React 18 | UI (single-file component) |
| Vite 6 | Сборка и dev-сервер |
| Claude API | AI-ассистент (Sonnet 4.6) |
| Vercel | Хостинг + serverless API proxy |
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

# 3. Настроить переменную окружения в Vercel Dashboard:
#    ANTHROPIC_API_KEY = sk-ant-api03-...
```

Или через GitHub-интеграцию:
1. Импортировать репозиторий в [vercel.com/new](https://vercel.com/new)
2. Framework preset → **Vite**
3. Добавить `ANTHROPIC_API_KEY` в Environment Variables
4. Deploy

## Структура проекта

```
fahrtenbuch-light/
├── api/
│   └── chat.js              # Vercel serverless — Claude API proxy
├── docs/
│   └── TZ_FahrtenbuchLight_v2.docx   # Техническое задание
├── public/
│   └── favicon.svg           # Иконка приложения
├── src/
│   ├── App.jsx               # Основной компонент (5380+ строк)
│   └── main.jsx              # React entry point
├── .env.example              # Шаблон переменных окружения
├── .gitignore
├── index.html                # HTML-оболочка
├── package.json
├── vercel.json               # Конфигурация Vercel
├── vite.config.js            # Конфигурация Vite
└── README.md
```

## Работа с AI-ассистентом

Встроенный чат поддерживает команды:

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

*FahrtenbuchLight v42 · Март 2026*
