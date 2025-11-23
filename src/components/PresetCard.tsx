import React from 'react';
import * as Icons from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PresetCardProps {
  name: string;
  icon: string;
  description: string;
  selected?: boolean;
  onClick?: () => void;
  isFileUpload?: boolean;
}

export const PresetCard: React.FC<PresetCardProps> = ({
  name,
  icon,
  selected = false,
  onClick,
  isFileUpload = false
}) => {
  // Get icon component dynamically
  const IconComponent = (Icons as any)[icon] || Icons.Box;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:bg-accent hover:border-accent-foreground/20 py-6 gap-3',
        selected && 'border-primary bg-accent/50',
        isFileUpload && 'border-dashed'
      )}
      onClick={onClick}
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

