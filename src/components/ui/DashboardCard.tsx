import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  description?: string;
  descriptionColorClass?: string;
  colorClass?: string;
  bgClass?: string;
  svgPolyline?: {
    color: string;
    points: string;
  };
}

export function DashboardCard({
  title,
  value,
  icon,
  description,
  descriptionColorClass = "text-gray-600",
  colorClass = "text-gray-700",
  bgClass = "bg-gray-50",
  svgPolyline,
}: DashboardCardProps) {
  return (
    <div className={cn(
      "rounded-xl border border-gray-200 p-4 lg:p-6 transition-all duration-200 hover:shadow-md",
      bgClass
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className={cn("text-sm font-medium truncate", colorClass)}>
            {title}
          </h3>
          <div className="text-xl lg:text-2xl font-bold text-black leading-tight mt-1">
            {value}
          </div>
          {description && (
            <p className={cn("text-xs mt-1 truncate", descriptionColorClass)}>
              {description}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
      
      {svgPolyline && (
        <div className="mt-4">
          <svg
            className="w-full h-8"
            viewBox="0 0 80 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polyline
              points={svgPolyline.points}
              stroke={svgPolyline.color}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

export default DashboardCard;
