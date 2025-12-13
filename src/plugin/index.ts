/**
 * SnapFill Plugin - Main Entry Point
 * 
 * Figma plugin for populating designs with data from presets or CSV/JSON files.
 */

import { UIToPluginMessage, ErrorMessage, SuccessMessage } from './types';
import { sendSelectionState, getValidFrames } from './selection';
import { analyzeMapping } from './analysis';
import { fillMultipleFramesWithRandomData, fillTableWithRandomData, fillFrameWithData } from './fill';

// ============================================================================
// Plugin Initialization
// ============================================================================

figma.showUI(__html__, { 
  width: 480, 
  height: 600,
  themeColors: true 
});

// Listen for selection changes
figma.on('selectionchange', sendSelectionState);

// Send initial state
sendSelectionState();

// ============================================================================
// Message Handler
// ============================================================================

figma.ui.onmessage = async (msg: UIToPluginMessage) => {
  // Handle get-selection request (UI ready)
  if (msg.type === 'get-selection') {
    sendSelectionState();
    return;
  }
  
  // Handle analyze-selection request
  if (msg.type === 'analyze-selection') {
    const result = analyzeMapping(msg.dataKeys);
    figma.ui.postMessage(result);
    return;
  }
  
  // Handle fill-data request
  if (msg.type === 'fill-data') {
    console.log('[SnapFill] Received fill-data message');
    console.log('[SnapFill] fillMode:', msg.fillMode);
    console.log('[SnapFill] allData length:', msg.allData?.length);
    console.log('[SnapFill] data keys:', msg.data ? Object.keys(msg.data) : 'none');
    
    try {
      const validFrames = getValidFrames();
      console.log('[SnapFill] Valid frames:', validFrames.length);
      validFrames.forEach(f => console.log(`[SnapFill]   - "${f.name}" (${f.type})`));
      
      if (validFrames.length === 0) {
        const error: ErrorMessage = { 
          type: 'error', 
          message: 'Выберите фрейм для заполнения' 
        };
        figma.ui.postMessage(error);
        return;
      }

      // All changes within this handler are automatically grouped for undo
      if (msg.allData && Array.isArray(msg.allData) && msg.allData.length > 0) {
        const fillMode = msg.fillMode || 'cards';
        console.log('[SnapFill] Using fillMode:', fillMode);
        
        if (fillMode === 'table') {
          await fillTableWithRandomData(validFrames, msg.allData);
        } else {
          await fillMultipleFramesWithRandomData(validFrames, msg.allData);
        }
        
        const success: SuccessMessage = { 
          type: 'success', 
          message: validFrames.length === 1 
            ? 'Фрейм успешно заполнен!' 
            : `${validFrames.length} фреймов успешно заполнены!` 
        };
        figma.ui.postMessage(success);
      } else {
        await fillFrameWithData(validFrames[0], msg.data);
        const success: SuccessMessage = { 
          type: 'success', 
          message: 'Данные успешно заполнены!' 
        };
        figma.ui.postMessage(success);
      }
      console.log('[SnapFill] Fill completed successfully');
    } catch (error) {
      console.error('[SnapFill] Fill error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      const errorMsg: ErrorMessage = { 
        type: 'error', 
        message: `Ошибка: ${errorMessage}` 
      };
      figma.ui.postMessage(errorMsg);
    }
  }
};
