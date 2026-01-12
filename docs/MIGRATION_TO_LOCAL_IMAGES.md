# Миграция на локальные изображения (опционально)

Если CORS Proxy не подходит для вашего случая, вы можете мигрировать на локальные изображения.

## Зачем это нужно?

### Преимущества локальных изображений:
- ✅ 100% надежность работы
- ✅ Нет зависимости от внешних сервисов
- ✅ Работает оффлайн
- ✅ Быстрая загрузка

### Недостатки:
- ⚠️ Увеличивает размер плагина
- ⚠️ Нужно предварительно скачать изображения
- ⚠️ Сложнее обновлять изображения

## Шаг 1: Создайте папку для изображений

```bash
mkdir -p src/assets/images
```

## Шаг 2: Скачайте изображения

### Вариант A: Вручную

Скачайте изображения и положите их в `src/assets/images/`:

```
src/assets/images/
├── iphone.jpg
├── vacuum.jpg
├── laptop.jpg
└── ...
```

### Вариант B: Скриптом

Создайте файл `scripts/download-images.sh`:

```bash
#!/bin/bash

# Список URL из ваших данных
declare -a urls=(
  "https://avatars.mds.yandex.net/get-mpic/4113189/2a000001920ef3e3d0ff2ecd7eab6f994b1b/optimize"
  "https://avatars.mds.yandex.net/get-mpic/12369201/2a000001949884bb461048332bbb2f287c6f/optimize"
  # ... добавьте остальные URL
)

# Соответствующие имена файлов
declare -a names=(
  "iphone"
  "vacuum"
  # ... добавьте остальные имена
)

mkdir -p src/assets/images

for i in "${!urls[@]}"; do
  echo "Downloading ${names[$i]}..."
  curl -L "${urls[$i]}" -o "src/assets/images/${names[$i]}.jpg"
done

echo "✅ All images downloaded!"
```

Затем запустите:

```bash
chmod +x scripts/download-images.sh
./scripts/download-images.sh
```

## Шаг 3: Конвертируйте в base64

```bash
npm run images:convert
```

Это создаст файл `src/assets/images-data.ts` с base64 изображениями:

```typescript
export const images: Record<string, string> = {
  "iphone": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "vacuum": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  // ...
};
```

## Шаг 4: Обновите данные

### Пример: products.ts

**Было:**
```typescript
export const productsData: DataItem[] = [
  {
    title: 'Apple iPhone 15 Pro',
    image: 'https://avatars.mds.yandex.net/get-mpic/4113189/...',
    price: '89 990 ₽'
  }
];
```

**Стало:**
```typescript
import { images } from '../../assets/images-data';

export const productsData: DataItem[] = [
  {
    title: 'Apple iPhone 15 Pro',
    image: images.iphone,  // ← Base64 изображение
    price: '89 990 ₽'
  }
];
```

## Шаг 5: Обновите все пресеты

Обновите файлы:
- [src/presets/data/products.ts](../src/presets/data/products.ts)
- [src/presets/data/orders.ts](../src/presets/data/orders.ts)
- [src/presets/data/messages.ts](../src/presets/data/messages.ts)
- [src/presets/data/reviews.ts](../src/presets/data/reviews.ts)

## Шаг 6: Соберите и протестируйте

```bash
npm run build
```

Перезапустите плагин в Figma и проверьте, что изображения загружаются.

## Оптимизация размера

Если размер плагина стал слишком большим:

### 1. Оптимизируйте изображения перед конвертацией

```bash
# Установите ImageMagick
brew install imagemagick  # macOS
# или
sudo apt install imagemagick  # Linux

# Сожмите изображения
for img in src/assets/images/*.jpg; do
  convert "$img" -quality 80 -resize 800x800\> "$img"
done
```

### 2. Используйте WebP формат

```bash
# Конвертируйте в WebP (меньший размер)
for img in src/assets/images/*.jpg; do
  cwebp -q 80 "$img" -o "${img%.jpg}.webp"
  rm "$img"  # Удалите оригинал
done
```

### 3. Используйте меньше изображений

Для пресетов достаточно 5-10 изображений на категорию.

## Откат на URL

Если вы захотите вернуться к URL:

1. Удалите `import { images }` из файлов данных
2. Верните URL в поля `image`
3. Пересоберите: `npm run build`

Текущая реализация с CORS Proxy будет работать автоматически.

## Гибридный подход

Вы можете использовать оба подхода:

```typescript
import { images } from '../../assets/images-data';

export const productsData: DataItem[] = [
  {
    title: 'iPhone (local)',
    image: images.iphone,  // ← Локальное изображение
  },
  {
    title: 'Product from URL',
    image: 'https://example.com/image.jpg',  // ← URL (через CORS proxy)
  }
];
```

## Автоматизация

Создайте скрипт для автоматической миграции:

```bash
#!/bin/bash
# scripts/migrate-to-local.sh

echo "🚀 Starting migration to local images..."

# 1. Скачать изображения
./scripts/download-images.sh

# 2. Конвертировать в base64
npm run images:convert

# 3. Обновить данные (вручную или скриптом)
echo "⚠️  Please update data files manually:"
echo "   - src/presets/data/products.ts"
echo "   - src/presets/data/orders.ts"
echo "   - etc."

# 4. Пересобрать
npm run build

echo "✅ Migration complete!"
```

## Поддержка

Если что-то не работает:

1. Проверьте, что изображения скачались: `ls -lh src/assets/images/`
2. Проверьте, что base64 файл создан: `ls -lh src/assets/images-data.ts`
3. Проверьте импорты в файлах данных
4. Пересоберите плагин: `npm run build`
5. Проверьте консоль в Figma для ошибок
