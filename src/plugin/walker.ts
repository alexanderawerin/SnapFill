/**
 * Unified tree walker for Figma node traversal.
 *
 * Iterative DFS with visitor pattern. All modules use this instead of
 * ad-hoc recursion, ensuring consistent depth limits, hidden-node skipping,
 * and efficient path tracking (mutable array with push/pop).
 *
 * Path snapshots are lazy — only allocated when visitor reads ctx.path.
 * Visitors that only need ctx.node (collectLayerNames, findFirstTextNode)
 * pay zero allocation cost per node.
 */

export interface WalkOptions {
  maxDepth?: number;    // default: 50
  skipHidden?: boolean; // default: true
}

export interface WalkContext {
  node: SceneNode;
  depth: number;
  /** Snapshot of ancestors from root to current node. Allocated lazily on first access. */
  readonly path: readonly SceneNode[];
}

export type WalkVisitor = (ctx: WalkContext) => 'continue' | 'skip-children' | 'stop';

const DEFAULT_MAX_DEPTH = 50;

/**
 * Walks a Figma node tree using iterative depth-first search.
 *
 * The visitor receives each node with its depth and ancestor path.
 * Return 'continue' to keep traversing, 'skip-children' to skip subtree,
 * or 'stop' to halt entirely.
 */
export function walkTree(
  root: SceneNode,
  visitor: WalkVisitor,
  options?: WalkOptions
): void {
  const maxDepth = options?.maxDepth ?? DEFAULT_MAX_DEPTH;
  const skipHidden = options?.skipHidden ?? true;

  // Mutable path maintained via push/pop + length restoration.
  const mutablePath: SceneNode[] = [];
  const stack: Array<{ node: SceneNode; depth: number; pathLen: number }> = [];

  stack.push({ node: root, depth: 0, pathLen: 0 });

  while (stack.length > 0) {
    const entry = stack.pop()!;
    const { node, depth, pathLen } = entry;

    // Restore path to the correct state for this node's parent
    mutablePath.length = pathLen;
    mutablePath.push(node);

    if (skipHidden && 'visible' in node && !node.visible) {
      continue;
    }

    if (depth > maxDepth) {
      continue;
    }

    // Lazy path snapshot: only allocate when the visitor reads .path
    let snapshot: SceneNode[] | null = null;
    const ctx: WalkContext = {
      node,
      depth,
      get path() {
        if (snapshot === null) {
          snapshot = [...mutablePath];
        }
        return snapshot;
      },
    };

    const result = visitor(ctx);

    if (result === 'stop') {
      return;
    }

    if (result === 'skip-children') {
      continue;
    }

    // Push children in reverse order so first child is processed first
    if ('children' in node) {
      const children = (node as SceneNode & ChildrenMixin).children;
      for (let i = children.length - 1; i >= 0; i--) {
        stack.push({
          node: children[i],
          depth: depth + 1,
          pathLen: mutablePath.length,
        });
      }
    }
  }
}
