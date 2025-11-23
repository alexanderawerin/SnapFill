// Main plugin code - runs in Figma sandbox

// Type definitions
type DataItemValue = string | number | boolean | null | undefined;
interface DataItem {
  [key: string]: DataItemValue;
}

figma.showUI(__html__, { 
  width: 400, 
  height: 520,
  themeColors: true 
});

// Message handler from UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'fill-data') {
    try {
      const selection = figma.currentPage.selection;
      
      if (selection.length === 0) {
        figma.ui.postMessage({ 
          type: 'error', 
          message: 'Выберите фрейм для заполнения' 
        });
        return;
      }

      // Filter only frames and components
      const validFrames = selection.filter(
        node => node.type === 'FRAME' || node.type === 'COMPONENT'
      );

      if (validFrames.length === 0) {
        figma.ui.postMessage({ 
          type: 'error', 
          message: 'Выберите хотя бы один фрейм или компонент' 
        });
        return;
      }

      // Handle selection with random data from array if available
      if (msg.allData && Array.isArray(msg.allData) && msg.allData.length > 0) {
        await fillMultipleFramesWithRandomData(validFrames, msg.allData);
        figma.ui.postMessage({ 
          type: 'success', 
          message: validFrames.length === 1 
            ? 'Фрейм успешно заполнен!' 
            : `${validFrames.length} фреймов успешно заполнены!` 
        });
      } 
      // Fallback to single data if no array available
      else {
        await fillFrameWithData(validFrames[0], msg.data);
        figma.ui.postMessage({ 
          type: 'success', 
          message: 'Данные успешно заполнены!' 
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      figma.ui.postMessage({ 
        type: 'error', 
        message: `Ошибка: ${errorMessage}` 
      });
    }
  }
};

/**
 * Helper function to get random data item from array
 */
function getRandomDataItem(availableData: DataItem[], dataArray: DataItem[]): DataItem {
  // If we've used all data, reset the available data
  if (availableData.length === 0) {
    availableData.push(...dataArray);
  }
  
  // Pick random item from available data
  const randomIndex = Math.floor(Math.random() * availableData.length);
  const randomData = availableData[randomIndex];
  
  // Remove used item to avoid duplicates in the same batch
  availableData.splice(randomIndex, 1);
  
  return randomData;
}

/**
 * Fills multiple frames with random data from array
 */
async function fillMultipleFramesWithRandomData(frames: SceneNode[], dataArray: DataItem[]) {
  // Create a copy of the data array to track used items
  const availableData = [...dataArray];
  
  for (const frame of frames) {
    const randomData = getRandomDataItem(availableData, dataArray);
    
    // Fill the frame with randomized children if it has repeated child frames
    await fillFrameWithRandomizedChildren(frame, randomData, dataArray);
  }
}

/**
 * Fills frame with data, applying randomization to repeated child frames
 */
async function fillFrameWithRandomizedChildren(node: SceneNode, data: DataItem, dataArray: DataItem[]) {
  if (!('children' in node)) {
    await fillFrameWithData(node, data);
    return;
  }

  // Find groups of children with the same name (potential repeated items like Snippet cards)
  const childrenByName = new Map<string, SceneNode[]>();
  
  for (const child of node.children) {
    if (child.type === 'FRAME' || child.type === 'COMPONENT') {
      const name = child.name;
      if (!childrenByName.has(name)) {
        childrenByName.set(name, []);
      }
      childrenByName.get(name)!.push(child);
    }
  }

  // Check if any name has multiple children (repeated pattern)
  const hasRepeatedChildren = Array.from(childrenByName.values()).some(group => group.length > 1);

  if (hasRepeatedChildren && dataArray.length > 1) {
    // Fill repeated children with different random data
    const availableData = [...dataArray];
    
    for (const child of node.children) {
      if (child.type === 'FRAME' || child.type === 'COMPONENT') {
        const childGroup = childrenByName.get(child.name);
        
        // Only randomize if this name appears multiple times
        if (childGroup && childGroup.length > 1) {
          const randomData = getRandomDataItem(availableData, dataArray);
          await fillFrameWithData(child, randomData);
        } else {
          // Single child with this name, use the provided data
          await fillFrameWithData(child, data);
        }
      } else {
        // Non-frame children, use regular fill
        await fillNodeWithData(child, data);
      }
    }
  } else {
    // No repeated children, use regular fill for the entire node
    await fillFrameWithData(node, data);
  }
}

/**
 * Recursively fills frame with data based on layer names
 */
async function fillFrameWithData(node: SceneNode, data: DataItem) {
  if ('children' in node) {
    for (const child of node.children) {
      await fillNodeWithData(child, data);
    }
  }
}

/**
 * Fills individual node with data if name matches
 */
async function fillNodeWithData(node: SceneNode, data: DataItem) {
  const nodeName = node.name;
  
  // Check if there's data for this node
  if (Object.prototype.hasOwnProperty.call(data, nodeName)) {
    const value = data[nodeName];
    
    // Handle text nodes - convert any value to string
    if (node.type === 'TEXT' && value !== null && value !== undefined) {
      const stringValue = String(value);
      
      // Handle mixed fonts by loading all unique fonts
      if (node.fontName !== figma.mixed) {
        await figma.loadFontAsync(node.fontName as FontName);
      } else if (node.characters.length > 0) {
        // For mixed fonts, load the first character's font
        const firstCharFont = node.getRangeFontName(0, 1) as FontName;
        await figma.loadFontAsync(firstCharFont);
      } else {
        // Fallback for empty text nodes with mixed fonts - try common fonts
        await loadFallbackFont();
      }
      node.characters = stringValue;
    }
    
    // Handle image fills (URL) - support RECTANGLE, FRAME, and nodes with rounded corners
    else if (typeof value === 'string' && isImageUrl(value)) {
      if (node.type === 'RECTANGLE' || node.type === 'FRAME' || node.type === 'ELLIPSE' || 
          (node.type as any) === 'ROUNDED_RECTANGLE') {
        await fillImageFromUrl(node as GeometryMixin & MinimalFillsMixin, value);
      }
    }
  }
  
  // Recursively process children
  if ('children' in node) {
    for (const child of node.children) {
      await fillNodeWithData(child, data);
    }
  }
}

/**
 * Loads a fallback font when the current font can't be loaded
 * Tries common fonts in order of preference
 */
async function loadFallbackFont(): Promise<void> {
  const fallbackFonts: FontName[] = [
    { family: "Inter", style: "Regular" },
    { family: "Roboto", style: "Regular" },
    { family: "Arial", style: "Regular" },
    { family: "Helvetica", style: "Regular" },
  ];

  for (const font of fallbackFonts) {
    try {
      await figma.loadFontAsync(font);
      return; // Successfully loaded, exit
    } catch (error) {
      // Try next font
      continue;
    }
  }

  // If all fallbacks fail, log warning
  console.warn('All fallback fonts failed to load');
}

/**
 * Checks if string is an image URL
 */
function isImageUrl(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  if (!str.startsWith('http')) return false;
  
  // Check for common image extensions
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?|$)/i;
  if (imageExtensions.test(str)) return true;
  
  // Check for common image hosting domains and patterns
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
  ];
  
  return imagePatterns.some(pattern => pattern.test(str));
}

/**
 * Fills node with image from URL
 */
async function fillImageFromUrl(node: GeometryMixin & MinimalFillsMixin, imageUrl: string) {
  try {
    const image = await figma.createImageAsync(imageUrl);
    
    // Preserve existing scaleMode if the node already has an image fill, otherwise use FIT
    let scaleMode: 'FILL' | 'FIT' | 'CROP' | 'TILE' = 'FIT';
    
    if (node.fills && node.fills !== figma.mixed && Array.isArray(node.fills)) {
      const existingImageFill = node.fills.find(fill => fill.type === 'IMAGE') as ImagePaint | undefined;
      if (existingImageFill && existingImageFill.scaleMode) {
        scaleMode = existingImageFill.scaleMode;
      }
    }
    
    const fills: Paint[] = [{
      type: 'IMAGE',
      imageHash: image.hash,
      scaleMode: scaleMode
    }];
    
    node.fills = fills;
  } catch (error) {
    // Log error in development mode for debugging
    console.warn(`Failed to load image from URL: ${imageUrl}`, error);
    // Silently fail in production - images from some CDNs might not load
    // Don't show error to avoid cluttering the UI
  }
}

