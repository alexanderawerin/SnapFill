import { DataItem } from './types';
import { getRandomDataItem, loadFallbackFont, isImageUrl, fillImageFromUrl } from './helpers';
import { findTableColumns, findFieldNodes, discoverCards, Card } from './detection';

// ============================================================================
// Cards Mode - Bottom-Up Approach
// ============================================================================

/**
 * Fills frames with random data from array (Cards mode)
 * 
 * Strategy:
 * 1. Find all nodes whose names match data keys (bottom-up)
 * 2. Group these fields into cards by finding their common ancestors
 * 3. Fill each card with unique random data
 */
export async function fillMultipleFramesWithRandomData(
  frames: SceneNode[], 
  dataArray: DataItem[]
): Promise<void> {
  const fieldNames = new Set<string>();
  for (const item of dataArray) {
    for (const key of Object.keys(item)) {
      fieldNames.add(key);
    }
  }
  
  for (const frame of frames) {
    const fieldNodes = findFieldNodes(frame, fieldNames);
    if (fieldNodes.length === 0) continue;
    
    const cards = discoverCards(frame, fieldNodes);
    
    const availableData = [...dataArray];
    for (const card of cards) {
      const cardData = getRandomDataItem(availableData, dataArray);
      await fillCard(card, cardData);
    }
  }
}

/**
 * Fills a card's fields with data
 */
async function fillCard(card: Card, data: DataItem): Promise<void> {
  for (const [fieldName, node] of card.fields) {
    const value = data[fieldName];
    if (value === null || value === undefined) continue;
    await fillFieldNode(node, value);
  }
}

/**
 * Fills a single field node with its value
 */
async function fillFieldNode(node: SceneNode, value: string | number | boolean): Promise<void> {
  const stringValue = String(value);
  
  // Handle text nodes directly
  if (node.type === 'TEXT') {
    await fillTextNode(node, stringValue);
    return;
  }
  
  // Handle image fills on shapes
  if (isImageUrl(stringValue)) {
    const fillableTypes = ['RECTANGLE', 'FRAME', 'ELLIPSE', 'POLYGON', 'STAR', 'VECTOR'];
    if (fillableTypes.includes(node.type)) {
      await fillImageFromUrl(node as GeometryMixin & MinimalFillsMixin, stringValue);
      return;
    }
  }
  
  // If it's a container, find the first text node inside and fill it
  if ('children' in node && !isImageUrl(stringValue)) {
    const textNode = findFirstTextNode(node);
    if (textNode) {
      await fillTextNode(textNode, stringValue);
      return;
    }
  }
}

// ============================================================================
// Table Mode
// ============================================================================

/**
 * Fills table with random data (Table mode)
 * Synchronizes data across columns: Cell[i] in every column gets the SAME random data.
 * Falls back to recursive name-based fill when no table structure is detected.
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
// Core Fill Logic (for legacy/table mode)
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
  const hasMatch = Object.prototype.hasOwnProperty.call(data, nodeName);
  
  if (hasMatch) {
    const value = data[nodeName];
    
    if (node.type === 'TEXT' && value !== null && value !== undefined) {
      await fillTextNode(node, String(value));
      return;
    }
    
    if (typeof value === 'string' && isImageUrl(value)) {
      const fillableTypes = ['RECTANGLE', 'FRAME', 'ELLIPSE', 'POLYGON', 'STAR', 'VECTOR'];
      if (fillableTypes.includes(node.type)) {
        await fillImageFromUrl(node as GeometryMixin & MinimalFillsMixin, value);
        return;
      }
    }
    
    if ('children' in node && value !== null && value !== undefined && !isImageUrl(String(value))) {
      const textNode = findFirstTextNode(node);
      if (textNode) {
        await fillTextNode(textNode, String(value));
        return;
      }
    }
  }
  
  if ('children' in node) {
    for (const child of node.children) {
      await fillNodeWithData(child, data);
    }
  }
}

/**
 * Finds the first TEXT node inside a container (recursive, depth-first)
 */
function findFirstTextNode(node: SceneNode & { children: readonly SceneNode[] }): TextNode | null {
  for (const child of node.children) {
    if (child.type === 'TEXT') {
      return child;
    }
    if ('children' in child) {
      const found = findFirstTextNode(child as SceneNode & { children: readonly SceneNode[] });
      if (found) return found;
    }
  }
  return null;
}

/**
 * Fills a text node with string value.
 * For mixed-font nodes, loads all unique fonts used across character ranges
 * before replacing text, so Figma doesn't reject the assignment.
 */
async function fillTextNode(node: TextNode, value: string): Promise<void> {
  try {
    if (node.fontName !== figma.mixed) {
      await figma.loadFontAsync(node.fontName as FontName);
    } else if (node.characters.length > 0) {
      const fontsToLoad = new Set<string>();
      const fontNames: FontName[] = [];
      for (let i = 0; i < node.characters.length; i++) {
        const font = node.getRangeFontName(i, i + 1) as FontName;
        const key = `${font.family}::${font.style}`;
        if (!fontsToLoad.has(key)) {
          fontsToLoad.add(key);
          fontNames.push(font);
        }
      }
      await Promise.all(fontNames.map(f => figma.loadFontAsync(f)));
    } else {
      await loadFallbackFont();
    }
    node.characters = value;
  } catch (err) {
    const label = node.name || 'unknown';
    const detail = err instanceof Error ? err.message : String(err);
    figma.notify(`Не удалось заполнить «${label}»: ${detail}`, { error: true, timeout: 4000 });
  }
}
