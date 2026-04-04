// Re-export shared types for convenience
export type { DataItem, DataItemValue } from '@/types/shared';

import type { DataItem } from '@/types/shared';

export interface Preset {
  id: string;
  name: string;
  icon: string;
  description: string;
  category?: string;
  data: DataItem[];
}
