/**
 * Plugin Types
 * Keep in sync with src/types/shared.ts
 */

export type DataItemValue = string | number | boolean | null | undefined;

export interface DataItem {
  [key: string]: DataItemValue;
}

export type FillMode = 'cards' | 'table';

// UI → Plugin Messages
export interface FillDataMessage {
  type: 'fill-data';
  data: DataItem;
  allData: DataItem[] | null;
  fillMode: FillMode;
}

export interface AnalyzeSelectionMessage {
  type: 'analyze-selection';
  dataKeys: string[];
}

export interface GetSelectionMessage {
  type: 'get-selection';
}

export type UIToPluginMessage = FillDataMessage | AnalyzeSelectionMessage | GetSelectionMessage;

// Plugin → UI Messages
export interface SelectionChangedMessage {
  type: 'selection-changed';
  frameSelected: boolean;
  frameId?: string;
  frameName?: string;
  frameCount?: number;
}

export interface AnalysisResultMessage {
  type: 'analysis-result';
  matched: string[];
  unmatched: string[];
  totalLayers: number;
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export interface SuccessMessage {
  type: 'success';
  message: string;
}

export type PluginToUIMessage = 
  | SelectionChangedMessage 
  | AnalysisResultMessage 
  | ErrorMessage 
  | SuccessMessage;
