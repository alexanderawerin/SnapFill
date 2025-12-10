import { AnalysisResultMessage } from './types';
import { getValidFrames } from './selection';

/**
 * Recursively collects all layer names from a node
 */
function collectLayerNames(node: SceneNode, result: Set<string> = new Set()): Set<string> {
  result.add(node.name);
  
  if ('children' in node) {
    for (const child of node.children) {
      collectLayerNames(child, result);
    }
  }
  
  return result;
}

/**
 * Analyzes selection and returns which data keys will match layers
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
  
  const matched: string[] = [];
  const unmatched: string[] = [];
  
  for (const key of dataKeys) {
    if (allLayerNames.has(key)) {
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
