# Видео-фон — инструкция

> Как устроен динамический фон, как его менять и как работает автопауза.

---

## 1. Архитектура

Фон — это **предобработанный MP4-файл** с запечёнными фильтрами. Браузер показывает видео как есть, без CSS/SVG фильтрации в реальном времени.

### Файлы

| Файл | Назначение |
|------|------------|
| `public/bg-video.mp4` | Основное видео-фон (с фильтрами) |
| `public/bg-video-poster.jpg` | Первый кадр для мгновенного отображения до загрузки видео |

### Рендер (App.jsx)

```jsx
<video ref={bgVideoRef} autoPlay muted loop playsInline poster={BG_VIDEO_POSTER}
  style={{
    position: "fixed",
    top: 0, left: 0,
    width: "100vw", height: "100vh",
    objectFit: "cover",
    zIndex: -1,
    pointerEvents: "none",
    transform: "scale(1.03)"   // скрывает чёрные края при фильтрации
  }}>
  <source src={BG_VIDEO_SRC} type="video/mp4"/>
</video>
```

Константы:
```js
const BG_VIDEO_SRC = './bg-video.mp4';
const BG_VIDEO_POSTER = './bg-video-poster.jpg';
```

Видео рендерится только при `GLASS_MODE = true` (строка 18).

---

## 2. Фильтры видео (запечены в MP4)

Текущий вариант — **Golden Warm** (Variant D). Фильтры применены через ffmpeg при создании файла:

### Цепочка обработки

```
Исходное видео
  │
  ├─ Gaussian Blur (sigma=0.9) — сглаживание шума
  ├─ Unsharp Mask (5:5:2.4) — восстановление резкости, контурная чёткость
  ├─ Gamma Curves (0→0.06, 0.5→0.39, 1→0.76) — сжатие тонов, иллюстрированный вид
  ├─ Saturation ×1.7 — насыщенность
  ├─ Brightness +0.06, Contrast 0.52, Saturation ×1.25 — приглушение для читаемости
  └─ Color Balance (red shadows +0.08, green +0.04, blue -0.04) — тёплый золотистый тон
```

### ffmpeg-команда для пересоздания

```bash
ffmpeg -y -i original-video.mp4 \
  -vf "\
    gblur=sigma=0.9,\
    unsharp=5:5:2.4:5:5:0,\
    curves=all='0/0.06 0.5/0.39 1/0.76',\
    eq=saturation=1.7,\
    eq=brightness=0.06:contrast=0.52:saturation=1.25,\
    colorbalance=rs=0.08:gs=0.04:bs=-0.04:rh=0.05:gh=0.02:bh=-0.03\
  " \
  -pix_fmt yuv420p -c:v libx264 -profile:v high -crf 18 -movflags +faststart \
  bg-video.mp4
```

### Создание poster

```bash
ffmpeg -y -i bg-video.mp4 -vframes 1 -ss 1 -update 1 -q:v 2 bg-video-poster.jpg
```

### Важно

- `pix_fmt yuv420p` — обязательно, иначе не воспроизведётся в браузерах
- `profile:v high` — совместимость с мобильными
- `movflags +faststart` — быстрый старт без полной загрузки
- `crf 18` — высокое качество без лишнего веса

---

## 3. Замена фона

### Шаг 1: Подготовить новое видео

Применить ffmpeg-команду из раздела 2 к новому исходнику. Или подставить своё уже обработанное видео.

### Шаг 2: Заменить файлы

```bash
cp new-video.mp4 public/bg-video.mp4
ffmpeg -y -i public/bg-video.mp4 -vframes 1 -ss 1 -update 1 -q:v 2 public/bg-video-poster.jpg
```

### Шаг 3: Деплой

```bash
git add public/bg-video.mp4 public/bg-video-poster.jpg
git commit -m "style: update background video"
git push origin main
```

Никаких изменений в коде не требуется.

---

## 4. Автопауза видео

### Поведение

| Состояние | Видео |
|-----------|-------|
| Вход в приложение | Играет |
| Переключение табов (Übersicht, Ziele, Kosten...) | Играет (возобновляется, если было на паузе) |
| Скролл контента | Пауза |
| Клик по кнопке/форме | Пауза |
| Ввод с клавиатуры | Пауза |
| Тач по контенту | Пауза |
| 30 секунд без действий | Возобновляется |

### Реализация (App.jsx)

```js
// useEffect в FahrtenbuchApp
const IDLE_DELAY = 30000;  // 30 секунд

const onActivity = (e) => {
  // Клики по шапке (data-nav) → возобновить видео
  if (e?.target?.closest?.('[data-nav]')) {
    if (vid.paused) vid.play();
    return;
  }
  // Рабочие действия → пауза
  if (!vid.paused) vid.pause();
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => vid.play(), IDLE_DELAY);
};

// Отслеживаемые события
const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
```

### Атрибут `data-nav`

Элемент `<header>` имеет `data-nav="1"`. Все клики внутри шапки (табы, номерной знак, селектор авто) **не вызывают паузу**, а наоборот — возобновляют видео.

### Настройка таймингов

| Константа | Значение | Описание |
|-----------|----------|----------|
| `IDLE_DELAY` | 30000 мс | Время бездействия до возобновления видео |

### Поведение при паузе

- Видео замирает мгновенно на текущем кадре
- Яркость и цвет **не меняются**
- Возобновление через нативный `video.play()`

---

## 5. Отключение фона

Для полного отключения видео-фона:

```js
// App.jsx, строка 18
const GLASS_MODE = false;
```

Это отключит:
- Видео-фон
- Стеклянные карточки (glassmorphism)
- Blur на шапке

Приложение вернётся к стандартному Material-дизайну на белом фоне.

---

## 6. История вариантов

| Вариант | Фильтр | Результат |
|---------|--------|-----------|
| Raw | Без фильтра | Слишком резко, отвлекает |
| A — Soft Warm | `sepia(0.25) saturate(1.1)` | Слишком размыто |
| B — Illustrated Light | SVG blur + sharpen, нейтральный | Холодный оттенок |
| C — Toylike | Сильная постеризация | Чрезмерно мультяшный |
| D — Illustrated Warm | SVG illustrated + CSS warm | Хорошо, но цепочка фильтров убивает резкость |
| **D Golden (текущий)** | **ffmpeg pre-baked** | **Принят — тёплый, резкий, не отвлекает** |
