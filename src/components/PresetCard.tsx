import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ShoppingCart,
  Star,
  MessageCircle,
  Megaphone,
  ClipboardList,
  Package,
  Box,
} from 'lucide-react';
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

// Explicit icon mapping to avoid tree-shaking issues
const iconMap: Record<string, LucideIcon> = {
  ShoppingCart,
  Star,
  MessageCircle,
  Megaphone,
  ClipboardList,
  Package,
  Box,
};

const getIconComponent = (iconName: string): LucideIcon => {
  return iconMap[iconName] || Box;
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
        'cursor-pointer transition-all hover:bg-accent hover:border-primary/30 py-4 gap-2',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        selected && 'border-primary bg-primary/5',
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
        <div className="size-10 rounded-lg flex items-center justify-center bg-muted text-muted-foreground">
          <IconComponent className="size-5" />
        </div>
        <h3 className="text-[13px] font-medium text-center leading-tight line-clamp-1 px-2">
          {name}
        </h3>
      </CardContent>
    </Card>
  );
};

