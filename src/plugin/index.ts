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
  // Handle analyze-selection request
  if (msg.type === 'analyze-selection') {
    const result = analyzeMapping(msg.dataKeys);
    figma.ui.postMessage(result);
    return;
  }
  
  // Handle fill-data request
  if (msg.type === 'fill-data') {
    try {
      const validFrames = getValidFrames();
      
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      const errorMsg: ErrorMessage = { 
        type: 'error', 
        message: `Ошибка: ${errorMessage}` 
      };
      figma.ui.postMessage(errorMsg);
    }
  }
};
