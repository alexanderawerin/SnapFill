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

      const targetFrame = selection[0];
      
      if (targetFrame.type !== 'FRAME' && targetFrame.type !== 'COMPONENT') {
        figma.ui.postMessage({ 
          type: 'error', 
          message: 'Выберите фрейм или компонент' 
        });
        return;
      }

      await fillFrameWithData(targetFrame, msg.data);
      
      figma.ui.postMessage({ 
        type: 'success', 
        message: 'Данные успешно заполнены!' 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      figma.ui.postMessage({ 
        type: 'error', 
        message: `Ошибка: ${errorMessage}` 
      });
    }
  } else if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};

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
  if (data.hasOwnProperty(nodeName)) {
    const value = data[nodeName];
    
    // Handle text nodes
    if (node.type === 'TEXT' && typeof value === 'string') {
      await figma.loadFontAsync(node.fontName as FontName);
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
    
    const fills: Paint[] = [{
      type: 'IMAGE',
      imageHash: image.hash,
      scaleMode: 'FILL'
    }];
    
    node.fills = fills;
  } catch (error) {
    // Silently fail - images from some CDNs might not load
    // Don't show error to avoid cluttering the UI
  }
}

