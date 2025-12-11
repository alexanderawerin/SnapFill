/**
 * Bottom-up detection: find marked fields first, then discover cards from them
 * 
 * The key insight: designers mark specific fields (image, title, priceValue, etc.)
 * We find these fields first, then work backwards to discover what a "card" is
 */

// ============================================================================
// Types
// ============================================================================

export interface FieldNode {
  node: SceneNode;
  fieldName: string;
  path: SceneNode[]; // path from root to this node (for finding common ancestor)
}

export interface Card {
  container: SceneNode;
  fields: Map<string, SceneNode>; // fieldName -> node
}

// ============================================================================
// Node Helpers
// ============================================================================

export function isContainer(node: SceneNode): boolean {
  return 'children' in node;
}

export function getChildren(node: SceneNode): readonly SceneNode[] {
  if ('children' in node) {
    return (node as ChildrenMixin).children;
  }
  return [];
}

// ============================================================================
// Bottom-Up Field Detection
// ============================================================================

/**
 * Recursively finds all nodes whose names match any of the field names
 * Returns them with their full path from root for ancestor analysis
 */
export function findFieldNodes(
  node: SceneNode, 
  fieldNames: Set<string>,
  path: SceneNode[] = []
): FieldNode[] {
  const results: FieldNode[] = [];
  const currentPath = [...path, node];
  
  // Check if this node's name matches a field
  if (fieldNames.has(node.name)) {
    results.push({
      node,
      fieldName: node.name,
      path: currentPath
    });
  }
  
  // Recurse into children
  if ('children' in node) {
    for (const child of node.children) {
      results.push(...findFieldNodes(child, fieldNames, currentPath));
    }
  }
  
  return results;
}

/**
 * Groups field nodes by their parent card
 * 
 * Strategy: For each field, walk up the tree and find the ancestor that:
 * 1. Contains multiple different field types (not just one)
 * 2. Has siblings with similar field structure (= other cards)
 * 
 * The optimal card level is where we see repetition of the field pattern
 */
export function discoverCards(
  rootNode: SceneNode,
  fieldNodes: FieldNode[]
): Card[] {
  if (fieldNodes.length === 0) return [];
  
  console.log(`[SnapFill] discoverCards: analyzing ${fieldNodes.length} field nodes`);
  
  // Step 1: Find the best "card level" - the ancestor depth where cards repeat
  const cardLevel = findOptimalCardLevel(fieldNodes);
  
  if (cardLevel === -1) {
    console.log(`[SnapFill] No card structure detected - treating as single card`);
    // No repetition found - treat the whole selection as one card
    const fields = new Map<string, SceneNode>();
    for (const f of fieldNodes) {
      fields.set(f.fieldName, f.node);
    }
    return [{ container: rootNode, fields }];
  }
  
  // Step 2: Group fields by their ancestor at cardLevel
  const cardMap = new Map<SceneNode, Map<string, SceneNode>>();
  
  for (const fieldNode of fieldNodes) {
    // Get the ancestor at cardLevel depth
    const cardContainer = fieldNode.path[cardLevel];
    if (!cardContainer) continue;
    
    if (!cardMap.has(cardContainer)) {
      cardMap.set(cardContainer, new Map());
    }
    cardMap.get(cardContainer)!.set(fieldNode.fieldName, fieldNode.node);
  }
  
  // Step 3: Convert to Card array
  const cards: Card[] = [];
  for (const [container, fields] of cardMap) {
    cards.push({ container, fields });
  }
  
  console.log(`[SnapFill] Discovered ${cards.length} cards at level ${cardLevel}`);
  return cards;
}

/**
 * Finds the optimal tree depth where cards start repeating
 * 
 * We analyze the path of each field and find the level where:
 * - Different fields share the same ancestor (= they're in the same card)
 * - That ancestor has siblings (= other cards exist)
 */
function findOptimalCardLevel(fieldNodes: FieldNode[]): number {
  if (fieldNodes.length === 0) return -1;
  
  // Get the maximum path depth
  let maxDepth = 0;
  for (const f of fieldNodes) {
    maxDepth = Math.max(maxDepth, f.path.length);
  }
  
  // For each possible level (from deepest to shallowest)
  // Check how many unique ancestors we have at that level
  // The card level is where we have multiple ancestors with similar field patterns
  
  for (let level = maxDepth - 2; level >= 1; level--) {
    const ancestorGroups = groupByAncestorAtLevel(fieldNodes, level);
    
    // Skip if we only have one group (no card repetition at this level)
    if (ancestorGroups.size < 2) continue;
    
    // Check if the groups have similar field patterns (= they're cards)
    const patterns = Array.from(ancestorGroups.values()).map(fields => 
      new Set(fields.map(f => f.fieldName))
    );
    
    // If most groups have overlapping field names, this is likely the card level
    const firstPattern = patterns[0];
    let matchingPatterns = 0;
    
    for (const pattern of patterns) {
      let overlap = 0;
      for (const name of pattern) {
        if (firstPattern.has(name)) overlap++;
      }
      if (overlap > 0) matchingPatterns++;
    }
    
    // If all groups have some field overlap, this is our card level
    if (matchingPatterns === patterns.length) {
      return level;
    }
  }
  
  return -1;
}

/**
 * Groups field nodes by their ancestor at a specific level
 */
function groupByAncestorAtLevel(
  fieldNodes: FieldNode[], 
  level: number
): Map<SceneNode, FieldNode[]> {
  const groups = new Map<SceneNode, FieldNode[]>();
  
  for (const fieldNode of fieldNodes) {
    if (fieldNode.path.length <= level) continue;
    
    const ancestor = fieldNode.path[level];
    if (!groups.has(ancestor)) {
      groups.set(ancestor, []);
    }
    groups.get(ancestor)!.push(fieldNode);
  }
  
  return groups;
}

// ============================================================================
// Table Detection (kept for table mode)
// ============================================================================

interface TableColumn {
  column: SceneNode;
  cells: SceneNode[];
}

/**
 * Finds table columns by analyzing structure recursively
 * A table is identified by having 3+ container children, each with 2+ similar children (cells)
 */
export function findTableColumns(node: SceneNode): TableColumn[] {
  if (!('children' in node)) return [];
  
  const children = getChildren(node);
  const containerChildren: SceneNode[] = [];
  
  for (const child of children) {
    if (isContainer(child)) {
      containerChildren.push(child);
    }
  }
  
  if (containerChildren.length >= 3) {
    const result: TableColumn[] = [];
    
    for (const col of containerChildren) {
      const cells = extractCellsFromColumn(col);
      if (cells.length >= 2) {
        result.push({ column: col, cells });
      }
    }
    
    if (result.length >= 3) {
      return result;
    }
  }
  
  // Recurse into children to find nested table structure
  for (const child of children) {
    if (isContainer(child)) {
      const nestedResult = findTableColumns(child);
      if (nestedResult.length >= 3) {
        return nestedResult;
      }
    }
  }
  
  return [];
}

/**
 * Extracts cells from a column (all containers except first, assumed to be header)
 */
function extractCellsFromColumn(column: SceneNode): SceneNode[] {
  const children = getChildren(column);
  if (children.length < 2) return [];
  
  const containers: SceneNode[] = [];
  for (const child of children) {
    if (isContainer(child)) {
      containers.push(child);
    }
  }
  
  if (containers.length < 2) return [];
  return containers.slice(1);
}
