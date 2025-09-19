import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  colorClass?: string; // ex: 'text-green-500', 'text-blue-500'
  bgClass?: string; // ex: 'bg-green-50'
  description?: string;
  descriptionColorClass?: string; // ex: 'text-green-500'
  descriptionIcon?: React.ReactNode;
  svgPolyline?: { color: string; points: string };
  children?: React.ReactNode;
  className?: string;
}

export function DashboardCard({
  title,
  value,
  icon,
  colorClass = 'text-black',
  bgClass = 'bg-white',
  description,
  descriptionColorClass = '',
  descriptionIcon,
  svgPolyline,
  children,
  className,
}: DashboardCardProps) {
  return (
    <div className={cn('bg-white rounded-xl shadow-md p-4 lg:p-6 relative overflow-hidden flex flex-col gap-2', bgClass, colorClass, className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-gray-500 text-sm font-medium truncate">
            {title}
          </h3>
          <div className="text-xl lg:text-2xl font-bold text-black leading-tight mt-1">
            {value}
          </div>
          {description && (
            <div className={cn('text-xs mt-1 flex items-center gap-1', descriptionColorClass)}>
              {descriptionIcon}
              <span className="truncate">{description}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
      {children}
      {svgPolyline && (
        <div className="absolute bottom-2 right-2 opacity-40 pointer-events-none">
          <svg width="80" height="24">
            <polyline fill="none" stroke={svgPolyline.color} strokeWidth="2" points={svgPolyline.points} />
          </svg>
        </div>
      )}
    </div>
  );
}

export default DashboardCard;
