import { SelectionChangedMessage } from './types';

/**
 * Get valid frames from current selection
 * Includes FRAME, COMPONENT, INSTANCE, and SECTION nodes
 */
export function getValidFrames(): SceneNode[] {
  return figma.currentPage.selection.filter(
    node => node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'SECTION'
  );
}

/**
 * Send current selection state to UI
 */
export function sendSelectionState(): void {
  const validFrames = getValidFrames();
  
  if (validFrames.length > 0) {
    const frame = validFrames[0];
    const message: SelectionChangedMessage = {
      type: 'selection-changed',
      frameSelected: true,
      frameId: frame.id,
      frameName: frame.name,
      frameCount: validFrames.length
    };
    figma.ui.postMessage(message);
  } else {
    const message: SelectionChangedMessage = {
      type: 'selection-changed',
      frameSelected: false
    };
    figma.ui.postMessage(message);
  }
}
