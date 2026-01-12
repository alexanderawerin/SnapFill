import { DataItem } from './types';

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
    /\/image\//i,
    /\/img\//i,
    /\/images\//i,
    /\/assets\//i,
    /is\/image/i,
    /fmt=(jpg|jpeg|png|webp|gif)/i,
    /\.cdn\./i,
    /storeimages\.cdn/i,
    /avatars\.mds/i,
    /assetsadobe/i,
    /i\.pravatar\.cc/i,
  ];
  
  return imagePatterns.some(pattern => pattern.test(str));
}

/**
 * Fill node with image from URL
 * Tries multiple strategies to load the image:
 * 1. Direct URL
 * 2. CORS proxy (for CORS issues)
 * 3. Fallback to placeholder
 */
export async function fillImageFromUrl(
  node: GeometryMixin & MinimalFillsMixin,
  imageUrl: string
): Promise<void> {
  const strategies = [
    { name: 'Direct URL', url: imageUrl },
    { name: 'CORS Proxy', url: `https://corsproxy.io/?${encodeURIComponent(imageUrl)}` },
  ];

  for (const strategy of strategies) {
    try {
      console.log(`[SnapFill] Trying strategy: ${strategy.name} for ${imageUrl}`);
      const image = await figma.createImageAsync(strategy.url);
      console.log(`[SnapFill] ✓ Image loaded with ${strategy.name}: ${image.hash}`);

      const fills: Paint[] = [{
        type: 'IMAGE',
        imageHash: image.hash,
        scaleMode: 'FIT'
      }];

      node.fills = fills;
      console.log(`[SnapFill] ✓ Image applied successfully`);
      return; // Success, exit function
    } catch (error) {
      console.warn(`[SnapFill] ✗ ${strategy.name} failed:`, error);
      // Continue to next strategy
    }
  }

  // All strategies failed
  console.error(`[SnapFill] ✗ All strategies failed for ${imageUrl}`);
  figma.notify(`⚠️ Не удалось загрузить изображение: ${imageUrl.substring(0, 50)}...`, {
    error: true,
    timeout: 3000
  });
}
