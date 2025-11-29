// Preset types for SnapFill plugin

// Re-export shared types for convenience
export { DataItem, DataItemValue } from '@/types/shared';

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

