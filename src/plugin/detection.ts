/**
 * Structure detection for tables and components
 */

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
// Table Detection
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

// ============================================================================
// Component Collection (Cards mode)
// ============================================================================

/**
 * Recursively collects all components, instances, and card-like frames by name
 */
export function collectComponents(node: SceneNode, result: Map<string, SceneNode[]>): void {
  if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
    const name = node.name;
    if (!result.has(name)) {
      result.set(name, []);
    }
    result.get(name)!.push(node);
    return;
  }
  
  if (node.type === 'FRAME' && node.name.includes('/')) {
    const name = node.name;
    if (!result.has(name)) {
      result.set(name, []);
    }
    result.get(name)!.push(node);
  }
  
  if ('children' in node) {
    for (const child of node.children) {
      collectComponents(child, result);
    }
  }
}
