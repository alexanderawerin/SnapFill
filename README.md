# MDS • SnapFill

> Figma плагин для автоматического заполнения макетов данными из CSV/JSON файлов

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Figma Plugin](https://img.shields.io/badge/Figma-Plugin-purple)](https://www.figma.com/community)

## ✨ Возможности

- 🎨 **Встроенные пресеты данных** — готовые наборы для B2B и B2C сценариев
- 📁 **Загрузка данных** из CSV и JSON файлов
- ✍️ **Автоматическое заполнение** текстовых слоев по именам
- 🖼️ **Загрузка изображений** из URL (Яндекс CDN с нативной поддержкой CORS)
- 🔗 **Простой маппинг** по именам слоев
- 🔄 **Множественное заполнение** — выбор нескольких фреймов и заполнение случайными данными
- 🇷🇺 **Работает из России** — прямая загрузка изображений без proxy
- 🚀 **Быстрая загрузка** — изображения за ~300-500ms

---

## 📦 Установка

### Требования

- Node.js 18+
- Figma Desktop App

### Шаги установки

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/alexanderawerin/SnapFill.git
cd SnapFill

# 2. Установите зависимости
npm install

# 3. Соберите плагин
npm run build
```

### Загрузка в Figma

1. Откройте Figma Desktop
2. Меню: `Plugins` → `Development` → `Import plugin from manifest...`
3. Выберите файл `manifest.json` из корня проекта
4. Плагин готов к использованию! 🎉

---

## 🚀 Использование

### Способ 1: Встроенные пресеты

1. Запустите плагин: `Plugins` → `Development` → `MDS • SnapFill`
2. Выберите категорию: **B2B** или **B2C**
3. Выберите нужный пресет (Products, Orders, Reviews и т.д.)
4. Выделите фрейм(ы) в макете
5. Нажмите **"Заполнить"**

### Способ 2: Свои данные

1. Перейдите на вкладку **JSON/CSV**
2. Загрузите CSV или JSON файл
3. Выделите фрейм(ы) в макете
4. Нажмите **"Заполнить"**

### Подготовка макета

Назовите слои так же, как поля в данных:

```
Frame "Product Card"
├── Rectangle "image"      ← для изображения
├── Text "title"           ← для заголовка
├── Text "price"           ← для цены
└── Text "description"     ← для описания
```

**Пример данных (JSON):**
```json
{
  "title": "Apple iPhone 15 Pro",
  "price": "89 990 ₽",
  "description": "Титановый корпус, чип A17 Pro",
  "image": "https://avatars.mds.yandex.net/..."
}
```

---

## 📚 Формат данных

### CSV файл

```csv
title,description,price,image
Товар 1,Описание товара 1,1000,https://example.com/image1.jpg
Товар 2,Описание товара 2,2000,https://example.com/image2.jpg
```

### JSON файл

```json
{
  "title": "Товар 1",
  "description": "Описание товара 1",
  "price": "1000",
  "image": "https://example.com/image1.jpg"
}
```

**Или массив объектов:**
```json
[
  {
    "title": "Товар 1",
    "description": "Описание товара 1"
  },
  {
    "title": "Товар 2",
    "description": "Описание товара 2"
  }
]
```

---

## 🎯 Множественное заполнение

1. Создайте несколько одинаковых фреймов (карточек)
2. Выделите все фреймы (`Shift + Click`)
3. Загрузите JSON массив или CSV файл
4. Нажмите **"Заполнить"**
5. Каждый фрейм получит уникальные случайные данные! ✨

**Подробнее:** [docs/MULTIPLE_FRAMES_FEATURE.md](./docs/MULTIPLE_FRAMES_FEATURE.md)

---

## 🛠️ Разработка

### Команды

```bash
# Полная сборка плагина
npm run build

# Сборка в режиме watch (автоперезагрузка)
npm run dev

# Конвертация изображений в base64 (опционально)
npm run images:convert

# Проверка типов
npm run typecheck
```

### Структура проекта

```
SnapFill/
├── src/
│   ├── App.tsx              # React компонент UI
│   ├── main.tsx             # Точка входа React
│   ├── plugin/              # Логика плагина
│   │   ├── index.ts         # Точка входа плагина (Figma API)
│   │   ├── fill.ts          # Заполнение данных
│   │   ├── detection.ts     # Детекция карточек
│   │   └── helpers.ts       # Утилиты (загрузка изображений)
│   ├── presets/             # Встроенные пресеты данных
│   │   ├── data/            # TypeScript-модули с данными
│   │   └── types.ts         # TypeScript типы
│   └── components/          # UI компоненты
├── docs/                    # Документация
├── examples/                # Примеры данных
├── scripts/                 # Скрипты автоматизации
├── dist/                    # Скомпилированные файлы
├── manifest.json            # Манифест плагина
└── package.json
```

---

## 📖 Документация

### Основные руководства

- 📘 [Руководство по пресетам](./docs/PRESETS_GUIDE.md)
- 📗 [Именование слоев в Figma](./docs/FIGMA_LAYER_GUIDE.md)
- 📕 [Множественное заполнение](./docs/MULTIPLE_FRAMES_FEATURE.md)
- 📙 [Примеры данных](./examples/README.md)

### Решение проблем

- 🔧 [Решение проблем с изображениями](./docs/FINAL_SOLUTION_SUMMARY.md)
- 🔐 [Что такое CORS?](./docs/WHAT_IS_CORS.md)
- 📊 [Полный индекс документации](./docs/INDEX.md)

---

## 🎨 Встроенные пресеты

### B2B категория
- **Products** — товары для маркетплейса
- **Orders** — заказы и статусы
- **Supplies** — поставки и приёмка товаров

### B2C категория
- **Messages** — чаты и сообщения
- **Reviews** — отзывы пользователей
- **Promotions** — акции и скидки

---

## 🌟 Особенности

### Умная детекция карточек

Плагин автоматически определяет структуру карточек товаров, используя **bottom-up подход**:

1. Находит все слои с именами из данных (image, title, price и т.д.)
2. Группирует их в логические карточки
3. Заполняет каждую карточку уникальными данными

**Работает с любой структурой макета!** Не нужно следовать строгой иерархии.

### Прямая загрузка изображений

- ✅ Яндекс CDN поддерживает CORS нативно
- ✅ Никаких proxy серверов
- ✅ Быстрая загрузка (~300-500ms)
- ✅ Работает из России и всех других стран

---

## 🤝 Contributing

Мы приветствуем вклад в проект! Пожалуйста:

1. Fork репозиторий
2. Создайте ветку для фичи (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в ветку (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

---

## 📝 Changelog

Все изменения документированы в [CHANGELOG.md](./CHANGELOG.md)

---

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](./LICENSE)

---

## 🙏 Благодарности

- [Figma Plugin API](https://www.figma.com/plugin-docs/)
- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [shadcn/ui](https://ui.shadcn.com/)

---

## 📞 Поддержка

Если у вас есть вопросы или проблемы:

1. Проверьте [документацию](./docs/INDEX.md)
2. Посмотрите [решение проблем](./docs/FINAL_SOLUTION_SUMMARY.md)
3. Создайте [Issue](https://github.com/alexanderawerin/SnapFill/issues)

---

<p align="center">Сделано с ❤️ для Figma Community</p>
