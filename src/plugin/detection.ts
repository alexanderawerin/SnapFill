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

  // DEBUG: Log all field nodes and their paths
  for (const f of fieldNodes) {
    const pathStr = f.path.map(n => n.name).join(' → ');
    console.log(`[SnapFill]   Field "${f.fieldName}" at depth ${f.path.length}: ${pathStr}`);
  }

  // Step 1: Find the best "card level" - the ancestor depth where cards repeat
  const cardLevel = findOptimalCardLevel(fieldNodes);
  console.log(`[SnapFill] findOptimalCardLevel returned: ${cardLevel}`);

  if (cardLevel === -1) {
    console.log(`[SnapFill] No optimal card level found, trying fallback strategies...`);

    // Check if rootNode itself is a single card (INSTANCE/COMPONENT)
    // In this case, treat all fields as belonging to this one card
    const rootIsCard = rootNode.type === 'INSTANCE' || rootNode.type === 'COMPONENT';
    if (rootIsCard) {
      console.log(`[SnapFill] Root "${rootNode.name}" is ${rootNode.type} - treating as single card`);
      const fields = new Map<string, SceneNode>();
      for (const f of fieldNodes) {
        fields.set(f.fieldName, f.node);
      }
      console.log(`[SnapFill] Single card created with ${fields.size} fields: ${Array.from(fields.keys()).join(', ')}`);
      return [{ container: rootNode, fields }];
    }

    // Check if all fields have unique names - if so, it's likely a single card
    const uniqueFieldNames = new Set(fieldNodes.map(f => f.fieldName));
    if (uniqueFieldNames.size === fieldNodes.length) {
      console.log(`[SnapFill] All ${fieldNodes.length} fields have unique names - treating as single card`);
      const fields = new Map<string, SceneNode>();
      for (const f of fieldNodes) {
        fields.set(f.fieldName, f.node);
      }
      console.log(`[SnapFill] Single card created with ${fields.size} fields: ${Array.from(fields.keys()).join(', ')}`);
      return [{ container: rootNode, fields }];
    }

    // Fallback 1: Try to find component/instance boundaries
    const componentLevel = findComponentLevel(fieldNodes);
    if (componentLevel !== -1) {
      console.log(`[SnapFill] Using component boundary level: ${componentLevel}`);
      return groupFieldsByLevel(fieldNodes, componentLevel);
    }

    // Fallback 2: If we have multiple fields, try to group by common ancestor
    if (fieldNodes.length > 3) {
      const commonAncestorLevel = findCommonAncestorLevel(fieldNodes);
      if (commonAncestorLevel !== -1) {
        console.log(`[SnapFill] Using common ancestor level: ${commonAncestorLevel}`);
        return groupFieldsByLevel(fieldNodes, commonAncestorLevel);
      }
    }

    // Fallback 3: Treat as single card
    console.log(`[SnapFill] No structure detected - treating as single card`);
    const fields = new Map<string, SceneNode>();
    for (const f of fieldNodes) {
      fields.set(f.fieldName, f.node);
    }
    console.log(`[SnapFill] Single card created with ${fields.size} fields: ${Array.from(fields.keys()).join(', ')}`);
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
    console.log(`[SnapFill]   Card "${container.name}" has ${fields.size} fields: ${Array.from(fields.keys()).join(', ')}`);
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

  // Get the minimum path depth (to handle fields at different depths)
  let minDepth = Infinity;
  let maxDepth = 0;
  for (const f of fieldNodes) {
    minDepth = Math.min(minDepth, f.path.length);
    maxDepth = Math.max(maxDepth, f.path.length);
  }

  console.log(`[SnapFill] findOptimalCardLevel: minDepth=${minDepth}, maxDepth=${maxDepth}`);

  // Strategy: Find the shallowest level where we have multiple groups with good field diversity
  // This works better for deeply nested structures

  let bestLevel = -1;
  let bestScore = -1;

  for (let level = maxDepth - 2; level >= 1; level--) {
    const ancestorGroups = groupByAncestorAtLevel(fieldNodes, level);

    console.log(`[SnapFill]   Level ${level}: ${ancestorGroups.size} ancestor groups`);
    for (const [ancestor, fields] of ancestorGroups) {
      const uniqueFieldNames = new Set(fields.map(f => f.fieldName));
      const fieldNames = Array.from(uniqueFieldNames).join(', ');
      console.log(`[SnapFill]     - "${ancestor.name}": ${fields.length} fields, ${uniqueFieldNames.size} unique (${fieldNames})`);
    }

    // Skip if we only have one group (no card repetition at this level)
    if (ancestorGroups.size < 2) {
      console.log(`[SnapFill]   ❌ Only 1 group, skipping`);
      continue;
    }

    // Calculate patterns for each group
    const patterns = Array.from(ancestorGroups.values()).map(fields => {
      const uniqueNames = new Set<string>();
      for (const f of fields) {
        uniqueNames.add(f.fieldName);
      }
      return uniqueNames;
    });

    // Calculate metrics
    const avgFieldTypesPerGroup = patterns.reduce((sum, p) => sum + p.size, 0) / patterns.length;
    const minFieldTypes = Math.min(...patterns.map(p => p.size));
    const maxFieldTypes = Math.max(...patterns.map(p => p.size));

    console.log(`[SnapFill]   Avg unique fields: ${avgFieldTypesPerGroup.toFixed(1)}, min: ${minFieldTypes}, max: ${maxFieldTypes}`);

    // Check pattern overlap
    const firstPattern = patterns[0];
    let totalOverlap = 0;
    let matchingPatterns = 0;

    for (const pattern of patterns) {
      let overlap = 0;
      for (const name of pattern) {
        if (firstPattern.has(name)) overlap++;
      }
      if (overlap > 0) {
        matchingPatterns++;
        totalOverlap += overlap;
      }
    }

    const avgOverlap = totalOverlap / patterns.length;
    console.log(`[SnapFill]   Pattern overlap: ${matchingPatterns}/${patterns.length}, avg overlap: ${avgOverlap.toFixed(1)}`);

    // Scoring: prefer levels with:
    // 1. All groups have similar patterns (matchingPatterns === patterns.length)
    // 2. Good field diversity (avgFieldTypesPerGroup > 1)
    // 3. High overlap between patterns (avgOverlap > 0.5)
    // 4. Shallower levels (lower level number = closer to root)

    if (matchingPatterns === patterns.length && avgFieldTypesPerGroup > 1) {
      // Score based on field diversity and pattern overlap
      const score = avgFieldTypesPerGroup * avgOverlap;
      console.log(`[SnapFill]   ✅ Valid card level with score: ${score.toFixed(2)}`);

      if (score > bestScore) {
        bestScore = score;
        bestLevel = level;
      }
    }
  }

  if (bestLevel !== -1) {
    console.log(`[SnapFill]   ✅ Best card level: ${bestLevel} (score: ${bestScore.toFixed(2)})`);
    return bestLevel;
  }

  console.log(`[SnapFill]   ❌ No card level found`);
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

/**
 * Helper: Groups fields by level and returns cards
 */
function groupFieldsByLevel(fieldNodes: FieldNode[], level: number): Card[] {
  const cardMap = new Map<SceneNode, Map<string, SceneNode>>();

  for (const fieldNode of fieldNodes) {
    if (fieldNode.path.length <= level) continue;

    const cardContainer = fieldNode.path[level];
    if (!cardMap.has(cardContainer)) {
      cardMap.set(cardContainer, new Map());
    }
    cardMap.get(cardContainer)!.set(fieldNode.fieldName, fieldNode.node);
  }

  const cards: Card[] = [];
  for (const [container, fields] of cardMap) {
    console.log(`[SnapFill]   Card "${container.name}" has ${fields.size} fields: ${Array.from(fields.keys()).join(', ')}`);
    cards.push({ container, fields });
  }

  return cards;
}

/**
 * Fallback 1: Find component/instance boundaries
 * Components and instances are natural card boundaries
 */
function findComponentLevel(fieldNodes: FieldNode[]): number {
  if (fieldNodes.length === 0) return -1;

  // Look for the shallowest level where ancestors are components or instances
  let maxDepth = 0;
  for (const f of fieldNodes) {
    maxDepth = Math.max(maxDepth, f.path.length);
  }

  for (let level = 1; level < maxDepth; level++) {
    const ancestorGroups = groupByAncestorAtLevel(fieldNodes, level);

    // Check if at least some ancestors are components/instances
    let componentCount = 0;
    for (const [ancestor] of ancestorGroups) {
      if (ancestor.type === 'COMPONENT' || ancestor.type === 'INSTANCE') {
        componentCount++;
      }
    }

    // If we have multiple component/instance groups, this is likely the card level
    if (componentCount >= 2) {
      console.log(`[SnapFill]   Found ${componentCount} component/instance boundaries at level ${level}`);
      return level;
    }
  }

  return -1;
}

/**
 * Fallback 2: Find common ancestor level
 * Look for a level where most fields share ancestors
 */
function findCommonAncestorLevel(fieldNodes: FieldNode[]): number {
  if (fieldNodes.length === 0) return -1;

  let maxDepth = 0;
  for (const f of fieldNodes) {
    maxDepth = Math.max(maxDepth, f.path.length);
  }

  // Find the level with the most balanced distribution
  // (not too deep, not too shallow)
  for (let level = Math.min(5, maxDepth - 2); level >= 2; level--) {
    const ancestorGroups = groupByAncestorAtLevel(fieldNodes, level);

    // We want 2-8 groups (reasonable number of cards)
    if (ancestorGroups.size >= 2 && ancestorGroups.size <= 8) {
      // Check if groups have at least 2 fields each
      let goodGroups = 0;
      for (const [, fields] of ancestorGroups) {
        const uniqueFieldNames = new Set(fields.map(f => f.fieldName));
        if (uniqueFieldNames.size >= 2) {
          goodGroups++;
        }
      }

      // If most groups have multiple fields, this is good
      if (goodGroups >= ancestorGroups.size / 2) {
        console.log(`[SnapFill]   Found common ancestor level ${level} with ${ancestorGroups.size} groups, ${goodGroups} have 2+ fields`);
        return level;
      }
    }
  }

  return -1;
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
