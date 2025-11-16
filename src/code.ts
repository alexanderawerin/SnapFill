// Main plugin code - runs in Figma sandbox

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
 * Fills multiple frames with random data from array
 */
async function fillMultipleFramesWithRandomData(frames: SceneNode[], dataArray: Record<string, any>[]) {
  // Create a copy of the data array to track used items
  const availableData = [...dataArray];
  
  for (const frame of frames) {
    // If we've used all data, reset the available data
    if (availableData.length === 0) {
      availableData.push(...dataArray);
    }
    
    // Pick random item from available data
    const randomIndex = Math.floor(Math.random() * availableData.length);
    const randomData = availableData[randomIndex];
    
    // Remove used item to avoid duplicates in the same batch
    availableData.splice(randomIndex, 1);
    
    // Fill the frame
    await fillFrameWithData(frame, randomData);
  }
}

/**
 * Recursively fills frame with data based on layer names
 */
async function fillFrameWithData(node: SceneNode, data: Record<string, any>) {
  if ('children' in node) {
    for (const child of node.children) {
      await fillNodeWithData(child, data);
    }
  }
}

/**
 * Fills individual node with data if name matches
 */
async function fillNodeWithData(node: SceneNode, data: Record<string, any>) {
  const nodeName = node.name;
  
  // Check if there's data for this node
  if (Object.prototype.hasOwnProperty.call(data, nodeName)) {
    const value = data[nodeName];
    
    // Handle text nodes
    if (node.type === 'TEXT' && typeof value === 'string') {
      // Handle mixed fonts by loading all unique fonts
      if (node.fontName !== figma.mixed) {
        await figma.loadFontAsync(node.fontName as FontName);
      } else {
        // For mixed fonts, load the first character's font
        const firstCharFont = node.getRangeFontName(0, 1) as FontName;
        await figma.loadFontAsync(firstCharFont);
      }
      node.characters = value;
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
    // Silently fail - images from some CDNs might not load
    // Don't show error to avoid cluttering the UI
  }
}

