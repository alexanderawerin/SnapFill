/**
 * Shared types for SnapFill plugin
 * 
 * NOTE: These types are duplicated in code.ts because Figma plugin architecture
 * requires UI (iframe) and plugin code (sandbox) to be separate bundles.
 * They communicate only via postMessage, so types cannot be shared at runtime.
 * 
 * Keep these definitions in sync with code.ts when making changes.
 */

export type DataItemValue = string | number | boolean | null | undefined;

export interface DataItem {
  [key: string]: DataItemValue;
}

/**
 * Message types for communication between UI and plugin code
 */
export interface FillDataMessage {
  type: 'fill-data';
  data: DataItem;
  allData: DataItem[] | null;
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export interface SuccessMessage {
  type: 'success';
  message: string;
}

export type PluginMessage = FillDataMessage | ErrorMessage | SuccessMessage;

