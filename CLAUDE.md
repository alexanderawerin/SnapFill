# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MDS SnapFill — Figma плагин для автоматического заполнения дизайн-макетов данными из CSV/JSON файлов или встроенных пресетов. Поддерживает интеллектуальное обнаружение карточек, загрузку изображений по URL, заполнение нескольких фреймов одновременно.

**UI на русском языке, код и комментарии на английском.**

## Build Commands

```bash
npm run dev            # Запуск dev-режима (plugin + UI с watch)
npm run build          # Продакшен-сборка
npm run typecheck      # Проверка типов (tsc --noEmit)
npm run images:convert # Конвертация изображений в base64
```

## Architecture

### Двухпроцессная модель Figma плагина

```
┌─ Plugin Sandbox (Figma) ─┐      ┌─ UI (React iframe) ─┐
│  src/plugin/index.ts     │ ←→   │  src/App.tsx        │
│  Figma API, заполнение   │      │  Интерфейс, парсинг │
└──────────────────────────┘      └─────────────────────┘
        postMessage для коммуникации
```

### Ключевые модули

- **`src/plugin/detection.ts`** — Bottom-up алгоритм обнаружения карточек. Сначала находит поля (image, title, price), затем группирует их в карточки по общим предкам.
- **`src/plugin/fill.ts`** — Логика заполнения данными и загрузки изображений.
- **`src/plugin/helpers.ts`** — Утилиты: детекция URL изображений, загрузка шрифтов.
- **`src/App.tsx`** — Главный UI компонент: табы (Пресеты/JSON-CSV), парсинг данных, режимы заполнения.
- **`src/presets/data/`** — 6 встроенных пресетов (products, orders, messages, reviews, promotion, supplies).

### Message Protocol (Plugin ↔ UI)

**UI → Plugin:** `fill-data`, `analyze-selection`, `get-selection`
**Plugin → UI:** `selection-changed`, `analysis-result`, `success`, `error`

### Два режима заполнения

- **Cards Mode** — случайные данные для каждой карточки
- **Table Mode** — синхронизация данных по колонкам таблицы

## Build Process

1. **Plugin** (`esbuild`): `src/plugin/index.ts` → `dist/code.js` (IIFE, ES2017 для Figma sandbox)
2. **UI** (`Vite`): `src/App.tsx` → `dist/ui.html` (single-file с инлайн CSS/JS)

Конфигурации: `scripts/build-plugin.mjs`, `vite.config.mts`

## Tech Stack

- TypeScript 5.3, React 18, TailwindCSS 4.1, shadcn/ui + Radix
- @figma/plugin-typings ^1.90.0
- PapaParse (CSV), esbuild + Vite

## Important Notes

- **Дублирование типов** между `src/types/shared.ts` и `src/plugin/types.ts` — by design (разные бандлы)
- **ES2017 target** для plugin кода — требование Figma sandbox
- **Изображения** загружаются напрямую с Yandex CDN (avatars.mds.yandex.net) — нативная поддержка CORS
- Подробная документация в `docs/` — перед реализацией проверять существующие решения
