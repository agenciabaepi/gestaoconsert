'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
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

export const OSStatsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
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

export const OSFiltersSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        <Skeleton width="w-64" height="h-10" className="rounded-lg" />
        <Skeleton width="w-40" height="h-10" className="rounded-lg" />
        <Skeleton width="w-32" height="h-10" className="rounded-lg" />
        <Skeleton width="w-28" height="h-10" className="rounded-lg" />
        <Skeleton width="w-24" height="h-10" className="rounded-lg" />
      </div>
    </div>
  );
};

export const OSTableRowSkeleton: React.FC = () => {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-3 py-4">
        <div className="flex items-center space-x-3">
          <Skeleton width="w-10" height="h-10" className="rounded-full" />
          <div>
            <Skeleton width="w-16" height="h-4" className="mb-1" />
            <Skeleton width="w-12" height="h-3" />
          </div>
        </div>
      </td>
      <td className="px-3 py-4">
        <div>
          <Skeleton width="w-32" height="h-4" className="mb-1" />
          <Skeleton width="w-20" height="h-3" />
        </div>
      </td>
      <td className="px-3 py-4">
        <div>
          <Skeleton width="w-24" height="h-4" className="mb-1" />
          <Skeleton width="w-16" height="h-3" />
        </div>
      </td>
      <td className="px-3 py-4">
        <Skeleton width="w-20" height="h-6" className="rounded-full" />
      </td>
      <td className="px-3 py-4">
        <Skeleton width="w-16" height="h-4" />
      </td>
      <td className="px-3 py-4">
        <Skeleton width="w-20" height="h-4" />
      </td>
      <td className="px-3 py-4">
        <Skeleton width="w-24" height="h-4" />
      </td>
      <td className="px-3 py-4">
        <div className="flex space-x-2">
          <Skeleton width="w-8" height="h-8" className="rounded" />
          <Skeleton width="w-8" height="h-8" className="rounded" />
          <Skeleton width="w-8" height="h-8" className="rounded" />
        </div>
      </td>
    </tr>
  );
};

export const OSTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 8 }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <Skeleton width="w-40" height="h-5" />
          <div className="flex gap-2">
            <Skeleton width="w-20" height="h-5" />
            <Skeleton width="w-16" height="h-5" />
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-3 text-left">
                <Skeleton width="w-12" height="h-4" />
              </th>
              <th className="px-3 py-3 text-left">
                <Skeleton width="w-16" height="h-4" />
              </th>
              <th className="px-3 py-3 text-left">
                <Skeleton width="w-20" height="h-4" />
              </th>
              <th className="px-3 py-3 text-left">
                <Skeleton width="w-16" height="h-4" />
              </th>
              <th className="px-3 py-3 text-left">
                <Skeleton width="w-14" height="h-4" />
              </th>
              <th className="px-3 py-3 text-left">
                <Skeleton width="w-16" height="h-4" />
              </th>
              <th className="px-3 py-3 text-left">
                <Skeleton width="w-18" height="h-4" />
              </th>
              <th className="px-3 py-3 text-left">
                <Skeleton width="w-16" height="h-4" />
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, index) => (
              <OSTableRowSkeleton key={index} />
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Skeleton */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-center gap-2">
          <Skeleton width="w-16" height="h-8" className="rounded" />
          <Skeleton width="w-8" height="h-8" className="rounded" />
          <Skeleton width="w-8" height="h-8" className="rounded" />
          <Skeleton width="w-8" height="h-8" className="rounded" />
          <Skeleton width="w-16" height="h-8" className="rounded" />
        </div>
      </div>
    </div>
  );
};

export const OSFullPageSkeleton: React.FC = () => {
  return (
    <div className="p-4 md:p-8 animate-pulse">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 gap-4">
        <div>
          <Skeleton width="w-64" height="h-8" className="mb-2" />
          <Skeleton width="w-80" height="h-5" />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Skeleton width="w-32" height="h-12" className="rounded-lg" />
          <Skeleton width="w-32" height="h-12" className="rounded-lg" />
        </div>
      </div>

      {/* Stats Cards */}
      <OSStatsSkeleton />

      {/* Filters */}
      <OSFiltersSkeleton />

      {/* Table */}
      <OSTableSkeleton rows={10} />
    </div>
  );
};
