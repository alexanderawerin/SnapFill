import { DataItem } from './types';
import { getRandomDataItem, loadFallbackFont, isImageUrl, fillImageFromUrl, NormalizedNameMap } from './helpers';
import { findTableColumns, findFieldNodes, discoverCards, Card } from './detection';
import { walkTree } from './walker';

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
// Core Fill Logic (for table mode fallback)
// ============================================================================

/**
 * Fills a frame with data by walking the tree and matching layer names.
 * Uses NormalizedNameMap for consistent matching with card-mode detection.
 * skip-children on match prevents filling inside matched containers.
 */
export async function fillFrameWithData(node: SceneNode, data: DataItem): Promise<void> {
  const keys = Object.keys(data).filter(k => data[k] != null);
  if (keys.length === 0) return;

  const nameMap = new NormalizedNameMap(keys);
  const nodesToFill: Array<{ node: SceneNode; key: string }> = [];

  walkTree(node, (ctx) => {
    const matchedKey = nameMap.match(ctx.node.name);
    if (matchedKey !== null) {
      nodesToFill.push({ node: ctx.node, key: matchedKey });
      return 'skip-children';
    }
    return 'continue';
  });

  for (const { node: fieldNode, key } of nodesToFill) {
    await fillFieldNode(fieldNode, data[key]!);
  }
}

/**
 * Finds the first TEXT node inside a container using unified walker.
 * Limited to 10 levels deep — text inside a named container should be shallow.
 */
function findFirstTextNode(node: SceneNode): TextNode | null {
  let found: TextNode | null = null;

  walkTree(node, (ctx) => {
    // Skip the root node itself
    if (ctx.node === node) return 'continue';
    if (ctx.node.type === 'TEXT') {
      found = ctx.node as TextNode;
      return 'stop';
    }
    return 'continue';
  }, { maxDepth: 10 });

  return found;
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
