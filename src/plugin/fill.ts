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
  console.log(`[SnapFill] fillMultipleFramesWithRandomData: ${frames.length} frames, ${dataArray.length} data items`);
  
  // Get all field names from the data
  const fieldNames = new Set<string>();
  for (const item of dataArray) {
    for (const key of Object.keys(item)) {
      fieldNames.add(key);
    }
  }
  console.log(`[SnapFill] Looking for fields: ${Array.from(fieldNames).join(', ')}`);
  
  for (const frame of frames) {
    // Step 1: Find all field nodes (bottom-up)
    const fieldNodes = findFieldNodes(frame, fieldNames);
    console.log(`[SnapFill] Found ${fieldNodes.length} field nodes in "${frame.name}"`);
    
    if (fieldNodes.length === 0) {
      console.log(`[SnapFill] No matching fields in "${frame.name}", skipping`);
      continue;
    }
    
    // Step 2: Discover cards from field nodes
    const cards = discoverCards(frame, fieldNodes);
    console.log(`[SnapFill] Discovered ${cards.length} cards`);
    
    // Step 3: Fill each card with unique random data
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
  console.log(`[SnapFill] Filling card "${card.container.name}" with ${card.fields.size} fields`);
  
  for (const [fieldName, node] of card.fields) {
    const value = data[fieldName];
    if (value === null || value === undefined) continue;
    
    console.log(`[SnapFill]   → ${fieldName}: "${String(value).substring(0, 30)}..."`);
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
// Core Fill Logic (for legacy/table mode)
// ============================================================================

/**
 * Recursively fills frame with data based on layer names
 */
export async function fillFrameWithData(node: SceneNode, data: DataItem): Promise<void> {
  console.log(`[SnapFill] fillFrameWithData: "${node.name}" (${node.type})`);
  console.log(`[SnapFill] Data keys: ${Object.keys(data).join(', ')}`);
  
  if ('children' in node) {
    console.log(`[SnapFill] Processing ${node.children.length} children`);
    for (const child of node.children) {
      await fillNodeWithData(child, data);
    }
  } else {
    console.log(`[SnapFill] Node has no children`);
  }
}

/**
 * Fills individual node with data if name matches
 */
async function fillNodeWithData(node: SceneNode, data: DataItem): Promise<void> {
  const nodeName = node.name;
  
  // Log every node being visited (for debugging)
  const hasMatch = Object.prototype.hasOwnProperty.call(data, nodeName);
  if (hasMatch) {
    const value = data[nodeName];
    console.log(`[SnapFill] ✓ MATCH: "${nodeName}" (${node.type}) = "${String(value).substring(0, 50)}..."`);
    
    // Handle text nodes directly
    if (node.type === 'TEXT' && value !== null && value !== undefined) {
      console.log(`[SnapFill]   → Filling TEXT node`);
      await fillTextNode(node, String(value));
      return; // Don't recurse into filled text nodes
    }
    
    // Handle image fills on shapes
    if (typeof value === 'string' && isImageUrl(value)) {
      const fillableTypes = ['RECTANGLE', 'FRAME', 'ELLIPSE', 'POLYGON', 'STAR', 'VECTOR'];
      if (fillableTypes.includes(node.type)) {
        console.log(`[SnapFill]   → Filling IMAGE`);
        await fillImageFromUrl(node as GeometryMixin & MinimalFillsMixin, value);
        return;
      } else {
        console.log(`[SnapFill]   → Skipping: node type ${node.type} not in fillable types`);
      }
    }
    
    // If it's a container (FRAME/INSTANCE/GROUP) with matching name but not TEXT,
    // try to find the first text node inside and fill it
    if ('children' in node && value !== null && value !== undefined && !isImageUrl(String(value))) {
      const textNode = findFirstTextNode(node);
      if (textNode) {
        console.log(`[SnapFill]   → Found text inside container, filling child TEXT "${textNode.name}"`);
        await fillTextNode(textNode, String(value));
        return; // Don't recurse - we've handled this container
      } else {
        console.log(`[SnapFill]   → Container has no text node inside`);
      }
    }
  }
  
  // Recurse into children for containers
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
 * Fills a text node with string value
 */
async function fillTextNode(node: TextNode, value: string): Promise<void> {
  console.log(`[SnapFill] fillTextNode: "${node.name}" <- "${value.substring(0, 50)}..."`);
  try {
    if (node.fontName !== figma.mixed) {
      await figma.loadFontAsync(node.fontName as FontName);
    } else if (node.characters.length > 0) {
      const firstCharFont = node.getRangeFontName(0, 1) as FontName;
      await figma.loadFontAsync(firstCharFont);
    } else {
      await loadFallbackFont();
    }
    node.characters = value;
    console.log(`[SnapFill] fillTextNode: SUCCESS`);
  } catch (err) {
    console.error(`[SnapFill] fillTextNode ERROR:`, err);
  }
}
