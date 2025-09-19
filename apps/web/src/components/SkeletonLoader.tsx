'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width = 'w-full', 
  height = 'h-4' 
}) => {
  return (
    <div 
      className={`${width} ${height} bg-gray-200 rounded animate-pulse ${className}`}
    />
  );
};

export const TableRowSkeleton: React.FC = () => {
  return (
    <tr className="border-b border-gray-100">
      <td className="px-2 py-3">
        <div className="flex items-center space-x-3">
          <Skeleton width="w-8" height="h-8" className="rounded-full" />
          <div>
            <Skeleton width="w-16" height="h-4" className="mb-1" />
            <Skeleton width="w-12" height="h-3" />
          </div>
        </div>
      </td>
      <td className="px-2 py-3">
        <div>
          <Skeleton width="w-24" height="h-4" className="mb-1" />
          <Skeleton width="w-20" height="h-3" />
        </div>
      </td>
      <td className="px-2 py-3">
        <div>
          <Skeleton width="w-20" height="h-4" className="mb-1" />
          <Skeleton width="w-16" height="h-3" />
        </div>
      </td>
      <td className="px-2 py-3">
        <Skeleton width="w-16" height="h-6" className="rounded-full" />
      </td>
      <td className="px-2 py-3">
        <Skeleton width="w-20" height="h-4" />
      </td>
      <td className="px-2 py-3">
        <Skeleton width="w-16" height="h-4" />
      </td>
      <td className="px-2 py-3">
        <div className="flex space-x-2">
          <Skeleton width="w-8" height="h-8" className="rounded" />
          <Skeleton width="w-8" height="h-8" className="rounded" />
        </div>
      </td>
    </tr>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header Skeleton */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <Skeleton width="w-32" height="h-5" />
          <Skeleton width="w-24" height="h-5" />
        </div>
      </div>
      
      {/* Table Skeleton */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-3 text-left">
                <Skeleton width="w-16" height="h-4" />
              </th>
              <th className="px-2 py-3 text-left">
                <Skeleton width="w-20" height="h-4" />
              </th>
              <th className="px-2 py-3 text-left">
                <Skeleton width="w-24" height="h-4" />
              </th>
              <th className="px-2 py-3 text-left">
                <Skeleton width="w-16" height="h-4" />
              </th>
              <th className="px-2 py-3 text-left">
                <Skeleton width="w-18" height="h-4" />
              </th>
              <th className="px-2 py-3 text-left">
                <Skeleton width="w-16" height="h-4" />
              </th>
              <th className="px-2 py-3 text-left">
                <Skeleton width="w-16" height="h-4" />
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, index) => (
              <TableRowSkeleton key={index} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const StatsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Skeleton width="w-20" height="h-4" className="mb-2" />
              <Skeleton width="w-16" height="h-8" className="mb-1" />
              <Skeleton width="w-24" height="h-3" />
            </div>
            <Skeleton width="w-12" height="h-12" className="rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const FiltersSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-wrap gap-4">
        <Skeleton width="w-48" height="h-10" className="rounded-lg" />
        <Skeleton width="w-32" height="h-10" className="rounded-lg" />
        <Skeleton width="w-32" height="h-10" className="rounded-lg" />
        <Skeleton width="w-24" height="h-10" className="rounded-lg" />
      </div>
    </div>
  );
};
