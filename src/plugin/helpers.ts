import { DataItem } from './types';

// ============================================================================
// Name Normalization
// ============================================================================

export function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Maps normalized layer names to original data keys.
 * Exact-case match takes priority over normalized match when
 * multiple data keys normalize to the same string.
 */
export class NormalizedNameMap {
  private exact: Set<string>;
  private normalized: Map<string, string>; // normalized -> original key

  constructor(fieldNames: Set<string> | string[]) {
    const names = fieldNames instanceof Set ? fieldNames : new Set(fieldNames);
    this.exact = names;
    this.normalized = new Map();

    for (const name of names) {
      const norm = normalizeName(name);
      // Don't overwrite if another key already maps to this normalized form —
      // exact match will handle disambiguation at lookup time
      if (!this.normalized.has(norm)) {
        this.normalized.set(norm, name);
      }
    }
  }

  match(nodeName: string): string | null {
    // Exact match first
    if (this.exact.has(nodeName)) {
      return nodeName;
    }
    // Normalized fallback
    const norm = normalizeName(nodeName);
    return this.normalized.get(norm) ?? null;
  }
}

// ============================================================================
// Data Helpers
// ============================================================================

/**
 * Get random data item from array without repetition
 */
export function getRandomDataItem(availableData: DataItem[], dataArray: DataItem[]): DataItem {
  if (availableData.length === 0) {
    availableData.push(...dataArray);
  }
  
  const randomIndex = Math.floor(Math.random() * availableData.length);
  const randomData = availableData[randomIndex];
  availableData.splice(randomIndex, 1);
  
  return randomData;
}

/**
 * Load fallback font when current font can't be loaded
 */
export async function loadFallbackFont(): Promise<void> {
  const fallbackFonts: FontName[] = [
    { family: "Inter", style: "Regular" },
    { family: "Roboto", style: "Regular" },
    { family: "Arial", style: "Regular" },
    { family: "Helvetica", style: "Regular" },
  ];

  for (const font of fallbackFonts) {
    try {
      await figma.loadFontAsync(font);
      return;
    } catch (_error) {
      continue;
    }
  }
}

/**
 * Check if string is an image URL
 */
export function isImageUrl(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  if (!str.startsWith('http')) return false;
  
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?|$)/i;
  if (imageExtensions.test(str)) return true;
  
  const imagePatterns = [
    /images\.unsplash\.com/i,
    /cdn.*\.com.*\.(jpg|jpeg|png|gif|webp|svg)/i,
    /\/image\/.*\.(jpg|jpeg|png|gif|webp|svg)/i,
    /\/img\/.*\.(jpg|jpeg|png|gif|webp|svg)/i,
    /\/images\/.*\.(jpg|jpeg|png|gif|webp|svg)/i,
    /is\/image/i,
    /fmt=(jpg|jpeg|png|webp|gif)/i,
    /storeimages\.cdn/i,
    /avatars\.mds/i,
    /assetsadobe.*\.(jpg|jpeg|png|gif|webp|svg)/i,
    /i\.pravatar\.cc/i,
  ];
  
  return imagePatterns.some(pattern => pattern.test(str));
}

/**
 * Fill node with image from URL
 * Note: Yandex CDN (avatars.mds.yandex.net) supports CORS natively,
 * so no proxy is needed for our images.
 */
export async function fillImageFromUrl(
  node: GeometryMixin & MinimalFillsMixin,
  imageUrl: string
): Promise<void> {
  try {
    const image = await figma.createImageAsync(imageUrl);

    const fills: Paint[] = [{
      type: 'IMAGE',
      imageHash: image.hash,
      scaleMode: 'FIT'
    }];

    node.fills = fills;
  } catch (error) {
    figma.notify(`⚠️ Не удалось загрузить изображение: ${imageUrl.substring(0, 50)}...`, {
      error: true,
      timeout: 3000
    });
  }
}
