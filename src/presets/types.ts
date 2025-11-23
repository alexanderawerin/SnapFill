// Preset types for SnapFill plugin

export type DataItemValue = string | number | boolean | null | undefined;

export interface DataItem {
  [key: string]: DataItemValue;
}

export interface Preset {
  id: string;
  name: string;
  icon: string; // lucide icon name
  description: string;
  data: DataItem[];
}

export type PresetCategory = 'b2b' | 'b2c' | 'file';

export interface PresetsByCategory {
  b2b: Preset[];
  b2c: Preset[];
}

