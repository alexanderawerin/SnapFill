import React from 'react';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PresetCardProps {
  name: string;
  icon: string;
  description?: string;
  selected?: boolean;
  onClick?: () => void;
  isFileUpload?: boolean;
}

// Type-safe icon lookup with fallback
const getIconComponent = (iconName: string): LucideIcon => {
  const icon = Icons[iconName as keyof typeof Icons];
  // Check if it's a valid React component (LucideIcon)
  if (icon && typeof icon === 'function') {
    return icon as LucideIcon;
  }
  return Icons.Box;
};

export const PresetCard: React.FC<PresetCardProps> = ({
  name,
  icon,
  description,
  selected = false,
  onClick,
  isFileUpload = false
}) => {
  const IconComponent = getIconComponent(icon);

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={description ? `${name}: ${description}` : name}
      className={cn(
        'cursor-pointer transition-all hover:bg-accent hover:border-accent-foreground/20 py-6 gap-3',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        selected && 'border-primary bg-accent/50',
        isFileUpload && 'border-dashed'
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <CardContent className="flex flex-col items-center justify-center p-0 gap-2">
        <div className="size-10 rounded-lg flex items-center justify-center bg-muted text-foreground">
          <IconComponent className="size-6" />
        </div>
        <h3 className="text-sm font-medium text-center leading-tight line-clamp-1 px-2 tracking-[-0.015em]">
          {name}
        </h3>
      </CardContent>
    </Card>
  );
};

