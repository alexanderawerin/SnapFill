#!/bin/bash

# Скрипт для миграции изображений на локальные base64
# Использование: ./scripts/migrate-images.sh

set -e

echo "🖼️  MDS SnapFill - Миграция на локальные изображения"
echo "=================================================="
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Проверка зависимостей
check_dependencies() {
    echo -e "${BLUE}📋 Проверка зависимостей...${NC}"

    if ! command -v curl &> /dev/null; then
        echo -e "${RED}❌ curl не установлен${NC}"
        exit 1
    fi

    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js не установлен${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Все зависимости установлены${NC}"
    echo ""
}

# Извлечение уникальных URL
extract_urls() {
    echo -e "${BLUE}🔍 Извлечение URL изображений...${NC}"

    grep -roh "https://avatars\.mds\.yandex\.net[^\"']*" src/presets/data/ | \
        sort -u > /tmp/snapfill_image_urls.txt

    local count=$(wc -l < /tmp/snapfill_image_urls.txt)
    echo -e "${GREEN}✅ Найдено уникальных изображений: ${count}${NC}"
    echo ""
}

# Создание директории
create_directory() {
    echo -e "${BLUE}📁 Создание директории для изображений...${NC}"

    mkdir -p src/assets/images

    echo -e "${GREEN}✅ Директория создана: src/assets/images/${NC}"
    echo ""
}

# Скачивание изображений
download_images() {
    echo -e "${BLUE}⬇️  Скачивание изображений...${NC}"
    echo ""

    local count=1
    local total=$(wc -l < /tmp/snapfill_image_urls.txt)
    local failed=0

    while IFS= read -r url; do
        # Генерируем имя файла из части URL
        local name=$(echo "$url" | sed 's|.*/||' | cut -c1-20)
        local filename="product_${count}.jpg"

        echo -ne "  [$count/$total] Скачивание ${filename}... "

        if curl -s -L "$url" -o "src/assets/images/${filename}" --max-time 30; then
            # Проверяем размер файла
            local size=$(stat -f%z "src/assets/images/${filename}" 2>/dev/null || stat -c%s "src/assets/images/${filename}")

            if [ "$size" -gt 1000 ]; then
                echo -e "${GREEN}✅ $(numfmt --to=iec --suffix=B $size 2>/dev/null || echo "${size} bytes")${NC}"
            else
                echo -e "${RED}❌ Файл слишком маленький${NC}"
                rm "src/assets/images/${filename}"
                ((failed++))
            fi
        else
            echo -e "${RED}❌ Ошибка загрузки${NC}"
            ((failed++))
        fi

        ((count++))
    done < /tmp/snapfill_image_urls.txt

    echo ""

    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}✅ Все изображения скачаны успешно${NC}"
    else
        echo -e "${YELLOW}⚠️  Не удалось скачать ${failed} изображений${NC}"
    fi

    echo ""
}

# Оптимизация изображений (опционально)
optimize_images() {
    echo -e "${BLUE}🔧 Оптимизация изображений...${NC}"

    if command -v convert &> /dev/null; then
        echo "  Используем ImageMagick для оптимизации..."

        for img in src/assets/images/*.jpg; do
            if [ -f "$img" ]; then
                echo -ne "  Оптимизация $(basename "$img")... "
                convert "$img" -quality 80 -resize 800x800\> "$img" 2>/dev/null && echo -e "${GREEN}✅${NC}" || echo -e "${YELLOW}⚠️${NC}"
            fi
        done

        echo -e "${GREEN}✅ Оптимизация завершена${NC}"
    else
        echo -e "${YELLOW}⚠️  ImageMagick не установлен, пропускаем оптимизацию${NC}"
        echo "  Установка: brew install imagemagick (macOS) или apt install imagemagick (Linux)"
    fi

    echo ""
}

# Конвертация в base64
convert_to_base64() {
    echo -e "${BLUE}🔄 Конвертация в base64...${NC}"

    if npm run images:convert; then
        echo -e "${GREEN}✅ Конвертация завершена${NC}"
    else
        echo -e "${RED}❌ Ошибка конвертации${NC}"
        exit 1
    fi

    echo ""
}

# Показать статистику
show_stats() {
    echo -e "${BLUE}📊 Статистика:${NC}"
    echo ""

    local count=$(ls -1 src/assets/images/*.jpg 2>/dev/null | wc -l)
    local total_size=$(du -sh src/assets/images 2>/dev/null | cut -f1)

    echo "  Изображений скачано: ${count}"
    echo "  Общий размер: ${total_size}"

    if [ -f "src/assets/images-data.ts" ]; then
        local base64_size=$(du -sh src/assets/images-data.ts | cut -f1)
        echo "  Размер base64 файла: ${base64_size}"
    fi

    echo ""

    # Размер плагина
    if [ -d "dist" ]; then
        local dist_size=$(du -sh dist | cut -f1)
        echo "  Текущий размер dist/: ${dist_size}"
        echo ""
    fi
}

# Инструкции по обновлению кода
show_instructions() {
    echo -e "${YELLOW}⚠️  Следующие шаги (вручную):${NC}"
    echo ""
    echo "1. Обновите импорты в файлах данных:"
    echo ""
    echo "   ${BLUE}import { images } from '../../assets/images-data';${NC}"
    echo ""
    echo "2. Замените URL на base64 изображения:"
    echo ""
    echo "   Было:"
    echo "   ${RED}image: 'https://avatars.mds.yandex.net/...'${NC}"
    echo ""
    echo "   Стало:"
    echo "   ${GREEN}image: images.product_1  // или другое имя${NC}"
    echo ""
    echo "3. Проверьте доступные имена изображений:"
    echo ""
    echo "   ${BLUE}cat src/assets/images-data.ts | grep '\"' | head -20${NC}"
    echo ""
    echo "4. Пересоберите плагин:"
    echo ""
    echo "   ${BLUE}npm run build${NC}"
    echo ""
    echo "5. Протестируйте в Figma"
    echo ""
}

# Предупреждение
show_warning() {
    echo -e "${YELLOW}⚠️  ВНИМАНИЕ:${NC}"
    echo ""
    echo "Эта операция:"
    echo "  • Скачает ~15 изображений (~1.5 MB)"
    echo "  • Создаст файл images-data.ts (~2 MB base64)"
    echo "  • Увеличит размер плагина с 392 KB до ~2.3 MB"
    echo ""
    echo -e "${YELLOW}Вы уверены что хотите продолжить? (y/n)${NC}"
    read -r response

    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo ""
        echo -e "${RED}❌ Операция отменена${NC}"
        exit 0
    fi

    echo ""
}

# Бэкап текущего состояния
backup_current() {
    echo -e "${BLUE}💾 Создание бэкапа...${NC}"

    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_dir="backups/before_migration_${timestamp}"

    mkdir -p "$backup_dir"

    # Бэкап файлов данных
    cp -r src/presets/data "$backup_dir/"

    echo -e "${GREEN}✅ Бэкап создан: ${backup_dir}${NC}"
    echo ""
}

# Главная функция
main() {
    echo ""

    # Предупреждение
    show_warning

    # Проверки
    check_dependencies

    # Бэкап
    backup_current

    # Основной процесс
    extract_urls
    create_directory
    download_images
    optimize_images
    convert_to_base64

    # Результаты
    show_stats
    show_instructions

    echo -e "${GREEN}✨ Миграция завершена!${NC}"
    echo ""
    echo "Следуйте инструкциям выше для обновления кода."
    echo ""
}

# Запуск
main
