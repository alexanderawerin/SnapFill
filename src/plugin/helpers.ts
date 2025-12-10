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
  } catch (_error) {
    // Silently fail - images from some CDNs might not load
  }
}
