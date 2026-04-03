# FahrtenbuchLight — Design System & Changelog

> Документ для разработчиков. Описывает текущий дизайн, архитектуру стилей и все изменения, внесённые при редизайне.

---

## 1. Тема оформления

### Единственная тема — Google Material + Glass

Приложение использует **одну фиксированную тему** `THEME_GOOGLE` (Material Design 3, светлая).

```js
// src/App.jsx, строка 13
let C = THEME_GOOGLE;

// src/theme.js
export const THEME_GOOGLE = {
  id: "google",
  label: "Material",
  font: "'Google Sans', 'Roboto', -apple-system, sans-serif",
  bg: "#F8F9FA",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F3F4",
  border: "#DADCE0",
  red: "#6AA4F0",      // основной акцент (голубой)
  gold: "#F9AB00",     // вторичный акцент
  // ... остальные цвета см. theme.js
  btnRadius: 24,
  cardRadius: 12,
  inputRadius: 12,
};
```

### Что было удалено

| Элемент | Описание | Коммит |
|---------|----------|--------|
| `THEME_CLASSIC` | Тема Classic (Inter, красные акценты, острые углы) | `4b57589` |
| `THEME_HYBRID` (Carbon) | Тема Carbon (Inter, градиенты, гибрид Classic + Material) | `4b57589` |
| `THEMES` объект | Словарь всех тем `{ classic, google, hybrid }` | `4b57589` |
| `themeId` / `setThemeId` | useState для переключения тем, localStorage сохранение | `2e806c9` |
| Блок «ERSCHEINUNGSBILD» | UI переключателя тем в настройках (карточки с превью) | `2e806c9` |
| `useGradients` / `headerGradient` | Условия для градиентов Carbon-темы (7 мест в коде) | `4b57589` |
| `grad()` / `gradBg()` | Helper-функции для градиентов (нигде не вызывались) | `4b57589` |
| `@import Inter` | Подключение шрифта Inter через CSS (не использовался) | `4b57589` |

### Шрифт

**Google Sans** (основной) + **Roboto** (фолбэк). Загружается через динамический `<link>` в `useEffect`:

```
https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto:wght@400;500;700&display=swap
```

---

## 2. Glassmorphism

### Флаг

```js
const GLASS_MODE = true; // строка 18, App.jsx
```

Когда `GLASS_MODE = true`:
- Карточки контента получают стеклянный фон с `backdrop-filter: blur`
- Шапка получает полупрозрачный фон с blur
- За контентом отображается видео-фон
- Оригинальные светлые цвета темы сохраняются (НЕ тёмная тема)

### GLASS объект (константы стекла)

```js
const GLASS = {
  background: 'rgba(244,244,240,0.82)',
  backdropFilter: 'blur(24px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderTop: '1px solid rgba(255,255,255,0.45)',
  borderLeft: '1px solid rgba(255,255,255,0.32)',
  borderRight: '1px solid rgba(255,255,255,0.12)',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6), inset 1px 0 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(255,255,255,0.15), inset -1px 0 0 rgba(255,255,255,0.09)',
};
```

### Градиентная рамка (glass-card)

Все карточки с GLASS-стилем получают CSS-класс `glass-card`, который добавляет `::after` псевдоэлемент с градиентной подсветкой краёв:

```css
.glass-card { position: relative; overflow: hidden; }
.glass-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 1;
  background: linear-gradient(
    135deg,
    rgba(255,255,255,0.55) 0%,
    rgba(255,255,255,0.18) 20%,
    transparent 45%,
    transparent 55%,
    rgba(255,255,255,0.12) 80%,
    rgba(255,255,255,0.4) 100%
  );
}
```

### Правило: что получает стекло, а что нет

| Элемент | Glass? | Примечание |
|---------|--------|------------|
| Карточки контента (KPI, списки, формы) | Да | `className="glass-card"` + GLASS стиль |
| Шапка (header) | Частично | Свой blur (`rgba(244,244,240,0.85)`), без `glass-card` |
| Табы навигации | Нет | Прозрачный фон, оригинальные цвета |
| Кнопки | Нет | Стандартные Material-кнопки |
| Модальные окна | Нет | Белый фон |

### GLASS_MODE overrides

При включённом GLASS_MODE тема слегка корректируется:

```js
if (GLASS_MODE) {
  C = { ...C,
    shadow: '0 4px 16px rgba(0,0,0,0.06)',
    shadowMd: '0 2px 8px rgba(0,0,0,0.04)',
  };
}
```

---

## 3. Динамический видео-фон

### Файлы

| Файл | Описание |
|------|----------|
| `public/bg-video.mp4` | Основное видео (автобан, трафик) |
| `public/bg-video-poster.jpg` | Статичный кадр-постер для первого рендера |

### Рендер

```jsx
<video ref={bgVideoRef} autoPlay muted loop playsInline poster={BG_VIDEO_POSTER}
  style={{
    position: "fixed",
    top: 0, left: 0,
    width: "100vw", height: "100vh",
    objectFit: "cover",
    zIndex: -1,
    pointerEvents: "none",
    filter: "brightness(1.12) contrast(0.52) saturate(1.25) sepia(0.15) hue-rotate(-5deg) url(#illustrated)",
    transform: "scale(1.03)",
  }}>
  <source src={BG_VIDEO_SRC} type="video/mp4"/>
</video>
```

### CSS-фильтр на видео (Variant D — Golden Warm)

Двухуровневая фильтрация:

**Уровень 1 — CSS `filter`:**
| Свойство | Значение | Назначение |
|----------|----------|------------|
| `brightness` | 1.12 | Осветление |
| `contrast` | 0.52 | Приглушение контраста для читаемости |
| `saturate` | 1.25 | Лёгкое усиление цвета |
| `sepia` | 0.15 | Тёплый золотистый оттенок |
| `hue-rotate` | -5deg | Компенсация синевы, сдвиг в тепло |
| `url(#illustrated)` | SVG-фильтр | Художественная стилизация |

**Уровень 2 — SVG-фильтр `#illustrated`:**
```xml
<filter id="illustrated" colorInterpolationFilters="sRGB">
  <!-- Лёгкое размытие — сглаживание шума видео -->
  <feGaussianBlur in="SourceGraphic" stdDeviation="0.9" result="smooth"/>
  <!-- Агрессивное повышение резкости — контурная иллюстрация -->
  <feConvolveMatrix in="smooth" order="3"
    kernelMatrix="0 -1.2 0 -1.2 5.8 -1.2 0 -1.2 0"
    preserveAlpha="true" result="sharp"/>
  <!-- Гамма-компрессия — сжатие тонов, мультяшный эффект -->
  <feComponentTransfer in="sharp" result="flat">
    <feFuncR type="gamma" amplitude="1" exponent="0.7" offset="0.06"/>
    <feFuncG type="gamma" amplitude="1" exponent="0.7" offset="0.06"/>
    <feFuncB type="gamma" amplitude="1" exponent="0.7" offset="0.06"/>
  </feComponentTransfer>
  <!-- Насыщенность -->
  <feColorMatrix in="flat" type="saturate" values="1.7"/>
</filter>
```

### Результат фильтра

Видео выглядит как тёплая, золотистая иллюстрация — не фотореалистично, но и не карикатурно. Мягкие контуры, приглушённый контраст, тёплая палитра. Текст на стеклянных карточках читается без проблем.

### История вариантов фильтра

| Вариант | Описание | Статус |
|---------|----------|--------|
| Raw (без фильтра) | Видео без обработки | Отклонён — слишком резко |
| A — Soft Warm | `sepia(0.25) saturate(1.1)` | Отклонён — слишком размыто |
| B — Illustrated Light | SVG blur + sharpen, нейтральный | Отклонён — холодный |
| C — Toylike | Сильная постеризация | Отклонён — слишком мультяшный |
| D — Illustrated Warm | SVG illustrated + `sepia(0.15) hue-rotate(-5deg)` | **Принят** (Golden Warm) |

---

## 4. Автопауза видео-фона

### Концепция

Видео играет при просмотре/навигации, но замирает когда пользователь начинает работать (заполнять формы, скроллить, кликать по контенту). Это убирает отвлекающее движение при работе, но сохраняет wow-эффект при просмотре.

### Логика

```
Видео ИГРАЕТ:
  ├─ При входе в приложение (демо-эффект)
  ├─ При переключении табов (Übersicht → Kosten → Fahrt...)
  └─ После 30 секунд без действий (idle-режим)

Видео НА ПАУЗЕ:
  ├─ Скролл контента
  ├─ Клик по кнопкам/формам внутри страницы
  ├─ Ввод с клавиатуры
  └─ Тач-действия (не по шапке)
```

### Реализация

```js
// useEffect в FahrtenbuchApp
const IDLE_DELAY = 30000;  // 30 сек без действий → resume
const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

const onActivity = (e) => {
  // Клики по шапке/табам (data-nav) → возобновить, не останавливать
  if (e?.target?.closest?.('[data-nav]')) {
    if (vid.paused) vid.play();
    return;
  }
  // Рабочие действия → пауза
  if (!vid.paused) vid.pause();
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => vid.play(), IDLE_DELAY);
};
```

### Атрибут `data-nav`

Элемент `<header>` имеет атрибут `data-nav="1"`. Все клики внутри шапки (табы, номерной знак, переключение авто) проверяются через `closest('[data-nav]')` и исключаются из триггера паузы.

### Поведение при паузе

- Видео замирает **мгновенно** на текущем кадре
- **Яркость и цвет не меняются** — картинка остаётся идентичной
- Возобновление плавное (браузерное `play()`)

---

## 5. Шапка (Header)

### Позиционирование

```
position: fixed    (не sticky — Chrome ломает sticky при overflow-x: hidden на родителе)
top: 0
left: 0
right: 0
z-index: 100
```

Под шапкой добавлен spacer:
```jsx
<div style={{height: headerH}}/>
```

`headerH` измеряется через `ResizeObserver` и всегда актуален.

### Стили шапки (GLASS_MODE)

```
background: rgba(244,244,240,0.85)
backdropFilter: blur(24px) saturate(1.4)
borderBottom: 0.5px solid rgba(221,221,216,0.6)
boxShadow: 0 2px 8px rgba(0,0,0,0.10), 0 6px 24px rgba(0,0,0,0.06)
```

### Дизайн шапки — НЕ МЕНЯТЬ

Шапка сохраняет оригинальный дизайн. Glass-эффект применяется **только к карточкам контента**, не к шапке. Высота шапки уменьшена (padding сжат), но структура (номерной знак, табы, кнопки) — без изменений.

---

## 6. Селектор автомобилей

### 3D-анимация переворота номера (flipKz)

При переключении автомобиля (из дропдауна или из настроек) номерной знак проигрывает 3D flip-анимацию:

```js
const flipKz = () => {
  setKzFlip(true);
  setTimeout(() => setKzFlip(false), 500);
};
```

### Дропдаун

- `position: fixed` (вынесен за пределы `<header>` для Safari iOS)
- Позиционируется через `getBoundingClientRect()` от номерного знака
- Полноширинный на мобильных (`100vw`)
- Оверлей `rgba(0,0,0,0.18)` за дропдауном

---

## 7. Адаптивность

### Брейкпоинты

```js
isMobile:  width <= 480
isTablet:  width > 480 && width <= 1024
isDesktop: width > 1024
```

### Типографика (desktop scale)

```js
const FS = {
  hint:  11,   // подсказки, вторичный текст
  pill:  11,   // бейджи
  label: 12,   // uppercase лейблы
  meta:  13,   // мета-информация, даты
  body:  14,   // основной текст
  sub:   16,   // подзаголовки карточек
  head:  17,   // заголовки секций
  kpi:   22,   // числа KPI
};
```

### Мобильные исправления

| Проблема | Решение | Коммит |
|----------|---------|--------|
| Горизонтальный скролл | `overflow: hidden` на всех карточках, `max-width: 100vw` | `fa3a42f` |
| Длинные тексты в «Последних поездках» | `text-overflow: ellipsis`, уменьшенные шрифты | `631feed` |
| Дропдаун селектора авто уезжает | Вынесен из header transform-контейнера, `position: fixed` | `8761e7a` |
| CustomSelect обрезается | `ReactDOM.createPortal` для рендера за пределами `overflow:hidden` | `ce39bf2` |

---

## 8. Настройки

### Текущие секции

1. **Fuhrpark** — управление автопарком (добавление/удаление авто)
2. **Datensicherung** — резервное копирование (только для Admin)

### Удалённые секции

| Секция | Описание | Причина удаления |
|--------|----------|-----------------|
| ERSCHEINUNGSBILD | Переключатель тем (Classic / Material / Carbon) | Тема зафиксирована на Google Material |

---

## 9. Сборка и деплой

### Два деплоя

| Платформа | Способ | URL |
|-----------|--------|-----|
| Vercel | `git push origin main` → авто-деплой | fahrtenbuch-light.vercel.app |
| S3 (Perplexity) | `npx vite build` + `patch-storage.cjs` + `deploy_website` | Embed в чате |

### S3 Build Process

1. Бэкап `App.jsx`, `cloudSync.js`, `vite.config.js`
2. Стаб `cloudSync.js` (отключение Supabase)
3. `vite.config.js` с `base: './'`
4. `npx vite build`
5. Восстановление бэкапов
6. Копирование `bg-video.mp4` и `bg-video-poster.jpg` в `dist/`
7. `node patch-storage.cjs` (замена `localStorage`/`sessionStorage` на in-memory для iframe)
8. Deploy

### CDN кеширование (Vercel)

Если Vite-хеш JS-файла не меняется (например, изменён только комментарий), CDN отдаёт старую версию. Для гарантированного обновления нужно менять **реальный код**, а не комментарии.

---

## 10. Хронология ключевых коммитов (дизайн)

| Коммит | Описание |
|--------|----------|
| `ee55595` | Glass-card с градиентной рамкой (`::after`) на все карточки |
| `190ecc1` | Селектор авто — выравнивание дропдауна под номерной знак |
| `35f22f4` | Cartoon-style SVG фильтр (illustrated) |
| `149b735` | Golden Warm фильтр (`sepia + hue-rotate`) — финальный вариант |
| `2e806c9` | Удаление переключателя тем, фиксация на Google Material |
| `425b84e` | Header: `position: fixed` вместо `sticky` |
| `015d5d9` | flipKz анимация в дропдауне авто |
| `4b57589` | Полная очистка мёртвого кода тем |
| `0748103` | Авто-пауза видео при активности пользователя |
| `f69e40e` | Tab-навигация возобновляет видео |
