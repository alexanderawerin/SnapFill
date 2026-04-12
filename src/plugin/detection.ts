/**
 * Bottom-up detection: find marked fields first, then discover cards from them
 *
 * The key insight: designers mark specific fields (image, title, priceValue, etc.)
 * We find these fields first, then work backwards to discover what a "card" is
 */

import { walkTree } from './walker';
import { NormalizedNameMap } from './helpers';

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
 * Finds all nodes whose names match any of the field names (normalized).
 * Returns them with their full path from root for ancestor analysis.
 */
export function findFieldNodes(
  node: SceneNode,
  fieldNames: Set<string>
): FieldNode[] {
  const nameMap = new NormalizedNameMap(fieldNames);
  const results: FieldNode[] = [];

  walkTree(node, (ctx) => {
    const matchedKey = nameMap.match(ctx.node.name);
    if (matchedKey !== null) {
      results.push({
        node: ctx.node,
        fieldName: matchedKey,
        path: ctx.path as SceneNode[], // walker provides a snapshot, safe to store
      });
    }
    return 'continue';
  });

  return results;
}

/**
 * Groups field nodes by their parent card.
 *
 * Two paths only:
 * 1. findOptimalCardLevel finds a valid level -> group by that level
 * 2. No level found -> treat all fields as one card under rootNode
 */
export function discoverCards(
  rootNode: SceneNode,
  fieldNodes: FieldNode[]
): Card[] {
  if (fieldNodes.length === 0) return [];

  const cardLevel = findOptimalCardLevel(fieldNodes);

  if (cardLevel !== -1) {
    return groupFieldsByLevel(fieldNodes, cardLevel);
  }

  // Single fallback: all fields belong to one card
  const fields = new Map<string, SceneNode>();
  for (const f of fieldNodes) {
    fields.set(f.fieldName, f.node);
  }
  return [{ container: rootNode, fields }];
}

/**
 * Finds the optimal tree depth where cards are located.
 *
 * For multi-card layouts: finds the level where ancestor groups have
 * similar field patterns (= repeating card structure).
 *
 * For single-card layouts: detects COMPONENT/INSTANCE boundaries
 * as natural card containers.
 */
function findOptimalCardLevel(fieldNodes: FieldNode[]): number {
  if (fieldNodes.length === 0) return -1;

  let maxDepth = 0;
  for (const f of fieldNodes) {
    maxDepth = Math.max(maxDepth, f.path.length);
  }

  let bestLevel = -1;
  let bestScore = -1;
  let singleCardLevel = -1;

  for (let level = maxDepth - 2; level >= 1; level--) {
    const ancestorGroups = groupByAncestorAtLevel(fieldNodes, level);

    if (ancestorGroups.size >= 2) {
      // Multi-card: score by pattern similarity
      const patterns = Array.from(ancestorGroups.values()).map(fields => {
        const uniqueNames = new Set<string>();
        for (const f of fields) {
          uniqueNames.add(f.fieldName);
        }
        return uniqueNames;
      });

      const avgFieldTypesPerGroup = patterns.reduce((sum, p) => sum + p.size, 0) / patterns.length;

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

      if (matchingPatterns === patterns.length && avgFieldTypesPerGroup > 1) {
        let score = avgFieldTypesPerGroup * avgOverlap;

        // Bonus for COMPONENT/INSTANCE boundaries
        let componentCount = 0;
        for (const [ancestor] of ancestorGroups) {
          if (ancestor.type === 'COMPONENT' || ancestor.type === 'INSTANCE') {
            componentCount++;
          }
        }
        if (componentCount >= 2) {
          score *= 1.5;
        }

        if (score > bestScore) {
          bestScore = score;
          bestLevel = level;
        }
      }
    } else if (ancestorGroups.size === 1 && singleCardLevel === -1) {
      // Single-card: check if the ancestor is a COMPONENT/INSTANCE
      const [ancestor] = ancestorGroups.keys();
      if (ancestor.type === 'COMPONENT' || ancestor.type === 'INSTANCE') {
        // Verify it contains multiple field types
        const fields = ancestorGroups.get(ancestor)!;
        const uniqueNames = new Set(fields.map(f => f.fieldName));
        if (uniqueNames.size >= 2) {
          singleCardLevel = level;
        }
      }
    }
  }

  // Prefer multi-card level; fall back to single-card level
  return bestLevel !== -1 ? bestLevel : singleCardLevel;
}

/**
 * Groups field nodes by their ancestor at a specific level.
 * Clamps to available path length so fields at different depths
 * still group correctly when a wrapper adds extra nesting.
 * Skips fields whose path is too short (delta > 2) to avoid
 * false groupings with the root node.
 */
function groupByAncestorAtLevel(
  fieldNodes: FieldNode[],
  level: number
): Map<SceneNode, FieldNode[]> {
  const groups = new Map<SceneNode, FieldNode[]>();

  for (const fieldNode of fieldNodes) {
    const effectiveLevel = Math.min(level, fieldNode.path.length - 1);
    // Skip if clamped too far — wrapper shouldn't differ by more than 2 levels
    if (level - effectiveLevel > 2) continue;
    const ancestor = fieldNode.path[effectiveLevel];
    if (!groups.has(ancestor)) {
      groups.set(ancestor, []);
    }
    groups.get(ancestor)!.push(fieldNode);
  }

  return groups;
}

/**
 * Groups fields by ancestor level and returns cards.
 * Uses clamped level for mixed-depth resilience (max delta 2).
 */
function groupFieldsByLevel(fieldNodes: FieldNode[], level: number): Card[] {
  const cardMap = new Map<SceneNode, Map<string, SceneNode>>();

  for (const fieldNode of fieldNodes) {
    const effectiveLevel = Math.min(level, fieldNode.path.length - 1);
    if (level - effectiveLevel > 2) continue;
    const cardContainer = fieldNode.path[effectiveLevel];
    if (!cardMap.has(cardContainer)) {
      cardMap.set(cardContainer, new Map());
    }
    cardMap.get(cardContainer)!.set(fieldNode.fieldName, fieldNode.node);
  }

  const cards: Card[] = [];
  for (const [container, fields] of cardMap) {
    cards.push({ container, fields });
  }

  return cards;
}

// ============================================================================
// Table Detection
// ============================================================================

interface TableColumn {
  column: SceneNode;
  cells: SceneNode[];
}

/**
 * Finds table columns by analyzing structure recursively.
 * A table is identified by having 3+ container children, each with 2+ similar children (cells).
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
 * Extracts cells from a column (all containers except first, assumed to be header).
 * Recurses through single-container wrappers with depth limit of 5.
 */
function extractCellsFromColumn(column: SceneNode, depth: number = 0): SceneNode[] {
  if (depth > 5) return [];

  const children = getChildren(column);
  const containers: SceneNode[] = [];
  for (const child of children) {
    if (isContainer(child)) {
      containers.push(child);
    }
  }

  if (containers.length >= 2) {
    return containers.slice(1);
  }

  // Single container child: pass through wrapper instances/frames
  if (containers.length === 1) {
    return extractCellsFromColumn(containers[0], depth + 1);
  }

  return [];
}
