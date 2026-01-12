# 📚 Документация MDS SnapFill

## 🚀 Быстрый старт

- [README](../README.md) — основная документация
- [QUICK_FIX_SUMMARY](../QUICK_FIX_SUMMARY.md) — краткое резюме исправлений
- [FINAL_SOLUTION_SUMMARY](./FINAL_SOLUTION_SUMMARY.md) — итоговое решение проблемы с изображениями

---

## 🖼️ Работа с изображениями

### Основные документы:
1. **[FINAL_SOLUTION_SUMMARY](./FINAL_SOLUTION_SUMMARY.md)** ⭐ — начните отсюда!
2. **[IMAGE_LOADING_TROUBLESHOOTING](./IMAGE_LOADING_TROUBLESHOOTING.md)** — решение проблем
3. **[IMAGE_LOADING_FLOW](./IMAGE_LOADING_FLOW.md)** — схема работы алгоритма
4. **[CORS_PROXY_RUSSIA_TEST](./CORS_PROXY_RUSSIA_TEST.md)** — тестирование из России

### Альтернативные решения:
- **[LOCAL_IMAGES_ANALYSIS](./LOCAL_IMAGES_ANALYSIS.md)** — анализ локальных изображений
- **[MIGRATION_TO_LOCAL_IMAGES](./MIGRATION_TO_LOCAL_IMAGES.md)** — миграция на base64
- **[ANSWERS_TO_YOUR_QUESTIONS](../ANSWERS_TO_YOUR_QUESTIONS.md)** — ответы на вопросы
- **[DECISION_MATRIX](../DECISION_MATRIX.md)** — матрица решений

---

## 🔐 Что такое CORS

- **[WHAT_IS_CORS](./WHAT_IS_CORS.md)** 📖 — подробное объяснение
- **[CORS_CHEATSHEET](./CORS_CHEATSHEET.md)** ⚡ — шпаргалка

---

## 📖 Руководства пользователя

- **[PRESETS_GUIDE](./PRESETS_GUIDE.md)** — руководство по пресетам
- **[FIGMA_LAYER_GUIDE](./FIGMA_LAYER_GUIDE.md)** — именование слоев в Figma
- **[MULTIPLE_FRAMES_FEATURE](./MULTIPLE_FRAMES_FEATURE.md)** — множественное заполнение

---

## 🛠️ Для разработчиков

- **[CHANGELOG](../CHANGELOG.md)** — история изменений
- **[TEST_IMAGES](./TEST_IMAGES.md)** — тестирование изображений
- **Scripts:**
  - `npm run build` — сборка плагина
  - `npm run dev` — режим разработки
  - `npm run images:convert` — конвертация изображений в base64

---

## 📊 Структура проекта

```
MDS SnapFill/
├── docs/                          # Документация
│   ├── INDEX.md                   # Этот файл
│   ├── WHAT_IS_CORS.md           # Объяснение CORS
│   ├── CORS_CHEATSHEET.md        # Шпаргалка по CORS
│   ├── CORS_PROXY_RUSSIA_TEST.md # Тестирование
│   ├── IMAGE_LOADING_*.md        # Работа с изображениями
│   ├── LOCAL_IMAGES_ANALYSIS.md  # Анализ размеров
│   ├── MIGRATION_TO_LOCAL_*.md   # Миграция
│   └── ...
├── src/                          # Исходный код
│   ├── plugin/                   # Код плагина
│   │   ├── helpers.ts           # Загрузка изображений
│   │   ├── fill.ts              # Заполнение данных
│   │   └── detection.ts         # Детекция карточек
│   ├── presets/                 # Пресеты данных
│   └── components/              # UI компоненты
├── scripts/                     # Скрипты автоматизации
│   ├── migrate-images.sh       # Миграция на base64
│   └── images-to-base64.mjs    # Конвертация изображений
├── dist/                        # Собранный плагин
├── manifest.json               # Манифест Figma
└── README.md                   # Основная документация
```

---

## 🎯 Решение проблем

### Изображения не загружаются?

1. **Прочитайте:** [FINAL_SOLUTION_SUMMARY](./FINAL_SOLUTION_SUMMARY.md)
2. **Проверьте CORS:** [CORS_PROXY_RUSSIA_TEST](./CORS_PROXY_RUSSIA_TEST.md)
3. **Альтернативы:** [DECISION_MATRIX](../DECISION_MATRIX.md)

### Нужна 100% надежность?

- [MIGRATION_TO_LOCAL_IMAGES](./MIGRATION_TO_LOCAL_IMAGES.md)

### Хотите понять, как работает CORS?

- [WHAT_IS_CORS](./WHAT_IS_CORS.md)

---

## 🔍 Быстрый поиск

| Вопрос | Документ |
|--------|----------|
| Что такое CORS? | [WHAT_IS_CORS](./WHAT_IS_CORS.md) |
| Работает ли из России? | [CORS_PROXY_RUSSIA_TEST](./CORS_PROXY_RUSSIA_TEST.md) |
| Как загружать изображения? | [FINAL_SOLUTION_SUMMARY](./FINAL_SOLUTION_SUMMARY.md) |
| Какие альтернативы? | [DECISION_MATRIX](../DECISION_MATRIX.md) |
| Как мигрировать на base64? | [MIGRATION_TO_LOCAL_IMAGES](./MIGRATION_TO_LOCAL_IMAGES.md) |
| Сколько весят изображения? | [LOCAL_IMAGES_ANALYSIS](./LOCAL_IMAGES_ANALYSIS.md) |
| Как использовать пресеты? | [PRESETS_GUIDE](./PRESETS_GUIDE.md) |

---

## 📞 Поддержка

Если не нашли ответ:
1. Проверьте [IMAGE_LOADING_TROUBLESHOOTING](./IMAGE_LOADING_TROUBLESHOOTING.md)
2. Посмотрите [TEST_IMAGES](./TEST_IMAGES.md)
3. Изучите [CHANGELOG](../CHANGELOG.md)

---

## 🎓 Рекомендуемый порядок чтения

### Для быстрого старта:
1. [README](../README.md)
2. [FINAL_SOLUTION_SUMMARY](./FINAL_SOLUTION_SUMMARY.md)
3. [CORS_CHEATSHEET](./CORS_CHEATSHEET.md)

### Для углубленного понимания:
1. [WHAT_IS_CORS](./WHAT_IS_CORS.md)
2. [CORS_PROXY_RUSSIA_TEST](./CORS_PROXY_RUSSIA_TEST.md)
3. [LOCAL_IMAGES_ANALYSIS](./LOCAL_IMAGES_ANALYSIS.md)
4. [DECISION_MATRIX](../DECISION_MATRIX.md)

### Для миграции на base64:
1. [LOCAL_IMAGES_ANALYSIS](./LOCAL_IMAGES_ANALYSIS.md)
2. [MIGRATION_TO_LOCAL_IMAGES](./MIGRATION_TO_LOCAL_IMAGES.md)
3. Запустить `./scripts/migrate-images.sh`

---

## 📈 Changelog

См. [CHANGELOG.md](../CHANGELOG.md) для истории всех изменений.
