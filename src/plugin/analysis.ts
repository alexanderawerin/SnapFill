import { AnalysisResultMessage } from './types';
import { getValidFrames } from './selection';
import { walkTree } from './walker';
import { NormalizedNameMap } from './helpers';

/**
 * Collects all layer names from a node tree using unified walker
 */
function collectLayerNames(root: SceneNode, result: Set<string>): void {
  walkTree(root, (ctx) => {
    result.add(ctx.node.name);
    return 'continue';
  });
}

/**
 * Analyzes selection and returns which data keys will match layers.
 * Uses normalized matching (trim + lowercase) consistent with detection.
 */
export function analyzeMapping(dataKeys: string[]): AnalysisResultMessage {
  const validFrames = getValidFrames();

  if (validFrames.length === 0) {
    return {
      type: 'analysis-result',
      matched: [],
      unmatched: dataKeys,
      totalLayers: 0
    };
  }

  const allLayerNames = new Set<string>();
  for (const frame of validFrames) {
    collectLayerNames(frame, allLayerNames);
  }

  // Build a NormalizedNameMap from layer names so data keys match
  // the same way detection does (case-insensitive, trimmed)
  const layerNameMap = new NormalizedNameMap(allLayerNames);

  const matched: string[] = [];
  const unmatched: string[] = [];

  for (const key of dataKeys) {
    if (layerNameMap.match(key) !== null) {
      matched.push(key);
    } else {
      unmatched.push(key);
    }
  }

  return {
    type: 'analysis-result',
    matched,
    unmatched,
    totalLayers: allLayerNames.size
  };
}
