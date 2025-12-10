import { DataItem } from './types';
import { getRandomDataItem, loadFallbackFont, isImageUrl, fillImageFromUrl } from './helpers';
import { findTableColumns, collectComponents } from './detection';

// ============================================================================
// Cards Mode
// ============================================================================

/**
 * Fills multiple frames with random data from array (Cards mode)
 */
export async function fillMultipleFramesWithRandomData(
  frames: SceneNode[], 
  dataArray: DataItem[]
): Promise<void> {
  const availableData = [...dataArray];
  
  for (const frame of frames) {
    const randomData = getRandomDataItem(availableData, dataArray);
    await fillFrameWithRandomizedChildren(frame, randomData, dataArray);
  }
}

/**
 * Fills frame with SYNCHRONIZED randomization to ALL repeated child groups
 */
async function fillFrameWithRandomizedChildren(
  node: SceneNode, 
  data: DataItem, 
  dataArray: DataItem[]
): Promise<void> {
  if (!('children' in node)) {
    await fillFrameWithData(node, data);
    return;
  }

  const componentsByName = new Map<string, SceneNode[]>();
  for (const child of node.children) {
    collectComponents(child, componentsByName);
  }

  const repeatedGroups = Array.from(componentsByName.values())
    .filter(nodes => nodes.length > 1);

  if (repeatedGroups.length > 0 && dataArray.length > 1) {
    const maxRows = Math.max(...repeatedGroups.map(g => g.length));
    
    const rowData: DataItem[] = [];
    const availableData = [...dataArray];
    for (let i = 0; i < maxRows; i++) {
      rowData.push(getRandomDataItem(availableData, dataArray));
    }
    
    for (const group of repeatedGroups) {
      for (let i = 0; i < group.length; i++) {
        const dataForRow = rowData[i % rowData.length];
        await fillFrameWithData(group[i], dataForRow);
      }
    }
  } else {
    await fillFrameWithData(node, data);
  }
}

// ============================================================================
// Table Mode
// ============================================================================

/**
 * Fills table with random data (Table mode)
 * Synchronizes data across columns: Cell[i] in every column gets the SAME random data
 */
export async function fillTableWithRandomData(
  frames: SceneNode[], 
  dataArray: DataItem[]
): Promise<void> {
  for (const frame of frames) {
    if (!('children' in frame)) {
      await fillFrameWithData(frame, dataArray[0]);
      continue;
    }

    const columns = findTableColumns(frame);
    
    if (columns.length === 0) {
      await fillFrameWithData(frame, dataArray[0]);
      continue;
    }
    
    let maxRows = 0;
    for (const col of columns) {
      maxRows = Math.max(maxRows, col.cells.length);
    }
    
    if (maxRows === 0) {
      await fillFrameWithData(frame, dataArray[0]);
      continue;
    }
    
    const rowData: DataItem[] = [];
    const availableData = [...dataArray];
    for (let i = 0; i < maxRows; i++) {
      rowData.push(getRandomDataItem(availableData, dataArray));
    }
    
    for (const col of columns) {
      for (let cellIndex = 0; cellIndex < col.cells.length; cellIndex++) {
        const dataForRow = rowData[cellIndex % rowData.length];
        await fillFrameWithData(col.cells[cellIndex], dataForRow);
      }
    }
  }
}

// ============================================================================
// Core Fill Logic
// ============================================================================

/**
 * Recursively fills frame with data based on layer names
 */
export async function fillFrameWithData(node: SceneNode, data: DataItem): Promise<void> {
  if ('children' in node) {
    for (const child of node.children) {
      await fillNodeWithData(child, data);
    }
  }
}

/**
 * Fills individual node with data if name matches
 */
async function fillNodeWithData(node: SceneNode, data: DataItem): Promise<void> {
  const nodeName = node.name;
  
  if (Object.prototype.hasOwnProperty.call(data, nodeName)) {
    const value = data[nodeName];
    
    // Handle text nodes
    if (node.type === 'TEXT' && value !== null && value !== undefined) {
      const stringValue = String(value);
      
      if (node.fontName !== figma.mixed) {
        await figma.loadFontAsync(node.fontName as FontName);
      } else if (node.characters.length > 0) {
        const firstCharFont = node.getRangeFontName(0, 1) as FontName;
        await figma.loadFontAsync(firstCharFont);
      } else {
        await loadFallbackFont();
      }
      node.characters = stringValue;
    }
    
    // Handle image fills
    else if (typeof value === 'string' && isImageUrl(value)) {
      const fillableTypes = ['RECTANGLE', 'FRAME', 'ELLIPSE', 'POLYGON', 'STAR', 'VECTOR'];
      if (fillableTypes.includes(node.type)) {
        await fillImageFromUrl(node as GeometryMixin & MinimalFillsMixin, value);
      }
    }
  }
  
  if ('children' in node) {
    for (const child of node.children) {
      await fillNodeWithData(child, data);
    }
  }
}
