import React from 'react';
import { Preset } from '@/presets/types';
import { PresetCard } from './PresetCard';

interface PresetsGridProps {
  presets: Preset[];
  selectedPresetId: string | null;
  onPresetSelect: (preset: Preset) => void;
}

export const PresetsGrid: React.FC<PresetsGridProps> = ({
  presets,
  selectedPresetId,
  onPresetSelect,
}) => {
  return (
    <div className="grid grid-cols-2 gap-2.5 px-4 pb-4">
      {presets.map((preset) => (
        <PresetCard
          key={preset.id}
          name={preset.name}
          icon={preset.icon}
          description={preset.description}
          selected={selectedPresetId === preset.id}
          onClick={() => onPresetSelect(preset)}
        />
      ))}
    </div>
  );
};

