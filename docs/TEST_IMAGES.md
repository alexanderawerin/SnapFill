# 🧪 Тестирование загрузки изображений

Используйте эти URL для проверки работы разных стратегий загрузки изображений.

## ✅ URL, которые ДОЛЖНЫ работать напрямую (Direct URL)

### Imgur (отличная CORS поддержка)
```
https://i.imgur.com/xqw3TGw.jpg
https://i.imgur.com/rZPJL5w.png
```

### Cloudinary (профессиональный CDN)
```
https://res.cloudinary.com/demo/image/upload/sample.jpg
```

### Unsplash (фото-платформа)
```
https://images.unsplash.com/photo-1523275335684-37898b6baf30
```

### imgbb
```
https://i.ibb.co/example.jpg
```

## ⚠️ URL, которые требуют CORS Proxy

### Яндекс CDN (из ваших данных)
```
https://avatars.mds.yandex.net/get-mpic/4113189/2a000001920ef3e3d0ff2ecd7eab6f994b1b/optimize
https://avatars.mds.yandex.net/get-mpic/12369201/2a000001949884bb461048332bbb2f287c6f/optimize
```

### Другие российские CDN
```
https://cdn.example.ru/images/product.jpg
```

## ❌ URL, которые НЕ должны работать

### Несуществующий домен
```
https://this-domain-does-not-exist-12345.com/image.jpg
```

### 404 ошибка
```
https://httpstat.us/404.jpg
```

### Очень большой файл (может не загрузиться из-за таймаута)
```
https://sample-videos.com/img/Sample-jpg-image-50mb.jpg
```

---

## 🧪 Тестовый пресет для Figma

Создайте временный пресет для тестирования в [src/presets/data/test-images.ts](../src/presets/data/test-images.ts):

```typescript
import { DataItem } from '../types';

export const testImagesData: DataItem[] = [
  {
    title: 'Test 1: Imgur (прямой)',
    image: 'https://i.imgur.com/xqw3TGw.jpg',
    description: 'Должно загрузиться напрямую'
  },
  {
    title: 'Test 2: Яндекс CDN (proxy)',
    image: 'https://avatars.mds.yandex.net/get-mpic/4113189/2a000001920ef3e3d0ff2ecd7eab6f994b1b/optimize',
    description: 'Должно загрузиться через CORS proxy'
  },
  {
    title: 'Test 3: Несуществующий URL',
    image: 'https://broken-url-12345.com/image.jpg',
    description: 'Должна показать ошибку'
  },
  {
    title: 'Test 4: Unsplash',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
    description: 'Должно загрузиться напрямую'
  }
];
```

---

## 📋 Чек-лист тестирования

### 1. Подготовка
- [ ] Плагин собран: `npm run build`
- [ ] Плагин загружен в Figma
- [ ] Консоль открыта: `Plugins → Development → Open Console`

### 2. Создайте тестовый фрейм

Создайте фрейм с такой структурой:

```
Frame "Test Card"
├── Rectangle "image"      ← для изображения
├── Text "title"           ← для заголовка
└── Text "description"     ← для описания
```

### 3. Проверьте каждый тип URL

#### Test 1: Imgur (прямой URL)
```
Ожидаемый результат:
✓ Изображение загружается
✓ Лог: "[SnapFill] ✓ Image loaded with Direct URL"
✓ Нет уведомлений об ошибках
```

#### Test 2: Яндекс CDN (через proxy)
```
Ожидаемый результат:
✓ Изображение загружается (может быть медленнее)
✓ Лог: "[SnapFill] ✗ Direct URL failed"
✓ Лог: "[SnapFill] ✓ Image loaded with CORS Proxy"
✓ Нет уведомлений об ошибках
```

#### Test 3: Несуществующий URL
```
Ожидаемый результат:
✗ Изображение НЕ загружается
✗ Лог: "[SnapFill] ✗ All strategies failed"
✓ Уведомление: "⚠️ Не удалось загрузить изображение"
```

#### Test 4: Unsplash
```
Ожидаемый результат:
✓ Изображение загружается
✓ Лог: "[SnapFill] ✓ Image loaded with Direct URL"
✓ Нет уведомлений об ошибках
```

---

## 🔍 Интерпретация логов

### ✅ Всё работает отлично
```
[SnapFill] Loading image from: https://i.imgur.com/...
[SnapFill] Trying strategy: Direct URL
[SnapFill] ✓ Image loaded with Direct URL: abc123
[SnapFill] ✓ Image applied successfully
```

### ⚠️ Работает через fallback (нормально)
```
[SnapFill] Loading image from: https://avatars.mds.yandex.net/...
[SnapFill] Trying strategy: Direct URL
[SnapFill] ✗ Direct URL failed: NetworkError
[SnapFill] Trying strategy: CORS Proxy
[SnapFill] ✓ Image loaded with CORS Proxy: def456
[SnapFill] ✓ Image applied successfully
```

### ❌ Проблема (нужно исправить URL)
```
[SnapFill] Loading image from: https://broken-url.com/...
[SnapFill] Trying strategy: Direct URL
[SnapFill] ✗ Direct URL failed: NetworkError
[SnapFill] Trying strategy: CORS Proxy
[SnapFill] ✗ CORS Proxy failed: NetworkError
[SnapFill] ✗ All strategies failed
```

---

## 📊 Ожидаемые результаты для production

| URL тип | Direct URL | CORS Proxy | Итог |
|---------|-----------|------------|------|
| Imgur | ✅ Работает | 🔄 Не нужен | ✅ |
| Cloudinary | ✅ Работает | 🔄 Не нужен | ✅ |
| Unsplash | ✅ Работает | 🔄 Не нужен | ✅ |
| Яндекс CDN | ❌ CORS ошибка | ✅ Работает | ✅ |
| Broken URL | ❌ 404/Network | ❌ 404/Network | ❌ |

---

## 🐛 Что делать, если тесты не проходят?

### Все изображения не загружаются
1. Проверьте `manifest.json` → `networkAccess.allowedDomains`
2. Убедитесь, что плагин пересобран: `npm run build`
3. Перезапустите Figma Desktop
4. Проверьте интернет-соединение

### Только Яндекс CDN не работает
1. Проверьте, что CORS Proxy доступен: откройте `https://corsproxy.io/` в браузере
2. Попробуйте другой URL из списка выше
3. Проверьте логи в консоли

### Уведомления об ошибках не показываются
1. Проверьте, что `figma.notify()` не заблокирован
2. Посмотрите в консоль — там точно будут логи

---

## 🎯 Быстрый тест (30 секунд)

1. Создайте rectangle с именем `image`
2. Запустите плагин
3. Вставьте этот JSON:
```json
{
  "image": "https://i.imgur.com/xqw3TGw.jpg"
}
```
4. Нажмите "Заполнить"
5. Изображение должно появиться в rectangle

Если работает — всё в порядке! ✅

---

## 📞 Поддержка

Если тесты не проходят:
1. Проверьте консоль для детальных логов
2. Прочитайте [docs/IMAGE_LOADING_TROUBLESHOOTING.md](./docs/IMAGE_LOADING_TROUBLESHOOTING.md)
3. Попробуйте мигрировать на локальные изображения: [docs/MIGRATION_TO_LOCAL_IMAGES.md](./docs/MIGRATION_TO_LOCAL_IMAGES.md)
