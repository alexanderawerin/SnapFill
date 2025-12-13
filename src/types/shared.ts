/**
 * Shared types for SnapFill plugin
 * 
 * NOTE: These types are duplicated in code.ts because Figma plugin architecture
 * requires UI (iframe) and plugin code (sandbox) to be separate bundles.
 * They communicate only via postMessage, so types cannot be shared at runtime.
 * 
 * Keep these definitions in sync with code.ts when making changes.
 */

// ============================================================================
// Data Types
// ============================================================================

export type DataItemValue = string | number | boolean | null | undefined;

export interface DataItem {
  [key: string]: DataItemValue;
}

export type FillMode = 'cards' | 'table';

// ============================================================================
// UI → Plugin Messages
// ============================================================================

/** Request to fill selected frames with data */
export interface FillDataMessage {
  type: 'fill-data';
  data: DataItem;
  allData: DataItem[] | null;
  fillMode: FillMode;
}

/** Request to analyze current selection for mapping preview */
export interface AnalyzeSelectionMessage {
  type: 'analyze-selection';
  dataKeys: string[];
}

/** All possible messages from UI to Plugin */
export type UIToPluginMessage = 
  | FillDataMessage
  | AnalyzeSelectionMessage;

// ============================================================================
// Plugin → UI Messages
// ============================================================================

/** Selection state changed in Figma */
export interface SelectionChangedMessage {
  type: 'selection-changed';
  frameSelected: boolean;
  frameId?: string;
  frameName?: string;
  frameCount?: number;
}

/** Analysis result for mapping preview */
export interface AnalysisResultMessage {
  type: 'analysis-result';
  /** Data keys that have matching layers in the frame */
  matched: string[];
  /** Data keys that have NO matching layers */
  unmatched: string[];
  /** Total number of fillable layers found */
  totalLayers: number;
}

/** Fill operation progress (for large batch operations) */
export interface ProgressMessage {
  type: 'progress';
  current: number;
  total: number;
}

/** Error occurred during operation */
export interface ErrorMessage {
  type: 'error';
  message: string;
}

/** Operation completed successfully */
export interface SuccessMessage {
  type: 'success';
  message: string;
}

/** All possible messages from Plugin to UI */
export type PluginToUIMessage = 
  | SelectionChangedMessage
  | AnalysisResultMessage
  | ProgressMessage
  | ErrorMessage
  | SuccessMessage;

// ============================================================================
// Type Guards
// ============================================================================

export function isSelectionChanged(msg: PluginToUIMessage): msg is SelectionChangedMessage {
  return msg.type === 'selection-changed';
}

export function isAnalysisResult(msg: PluginToUIMessage): msg is AnalysisResultMessage {
  return msg.type === 'analysis-result';
}

export function isProgress(msg: PluginToUIMessage): msg is ProgressMessage {
  return msg.type === 'progress';
}

export function isError(msg: PluginToUIMessage): msg is ErrorMessage {
  return msg.type === 'error';
}

export function isSuccess(msg: PluginToUIMessage): msg is SuccessMessage {
  return msg.type === 'success';
}
