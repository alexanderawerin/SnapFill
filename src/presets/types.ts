// Preset types for SnapFill plugin

// Re-export shared types for convenience
export type { DataItem, DataItemValue } from '@/types/shared';

// Import for use in this file
import type { DataItem } from '@/types/shared';

export interface Preset {
  id: string;
  name: string;
  icon: string; // lucide icon name
  description: string;
  category?: string;
  data: DataItem[];
}

export interface PresetsCollection {
  all: Preset[];
}
