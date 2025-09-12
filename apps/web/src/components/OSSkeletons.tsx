'use client';

import React from 'react';

/**
 * Componente base para skeleton loading
 */
const SkeletonBase = ({ className = '', ...props }: { className?: string; [key: string]: any }) => (
  <div
    className={`animate-pulse bg-gray-200 rounded ${className}`}
    {...props}
  />
);

/**
 * Skeleton para página de lista de OS
 */
export const OSListSkeleton = () => (
  <div className="p-4 md:p-8 space-y-6">
    {/* Header */}
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <SkeletonBase className="h-8 w-64 mb-2" />
        <SkeletonBase className="h-4 w-96" />
      </div>
      <div className="flex gap-3">
        <SkeletonBase className="h-10 w-24" />
        <SkeletonBase className="h-10 w-32" />
      </div>
    </div>

    {/* Cards de métricas */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <SkeletonBase className="h-4 w-20" />
            <SkeletonBase className="h-5 w-5 rounded-full" />
          </div>
          <SkeletonBase className="h-8 w-16 mb-2" />
          <SkeletonBase className="h-3 w-24" />
        </div>
      ))}
    </div>

    {/* Tabela */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex gap-4">
          <SkeletonBase className="h-10 w-64" />
          <SkeletonBase className="h-10 w-32" />
          <SkeletonBase className="h-10 w-32" />
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <SkeletonBase className="h-4 w-16" />
            <SkeletonBase className="h-4 w-32" />
            <SkeletonBase className="h-4 w-24" />
            <SkeletonBase className="h-4 w-20" />
            <SkeletonBase className="h-4 w-28" />
            <SkeletonBase className="h-4 w-20" />
            <SkeletonBase className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/**
 * Skeleton para página de visualização de OS
 */
export const OSViewSkeleton = () => (
  <div className="p-4 md:p-8 space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div>
        <SkeletonBase className="h-8 w-48 mb-2" />
        <SkeletonBase className="h-4 w-32" />
      </div>
      <div className="flex gap-3">
        <SkeletonBase className="h-10 w-24" />
        <SkeletonBase className="h-10 w-28" />
      </div>
    </div>

    {/* Conteúdo principal */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Informações básicas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <SkeletonBase className="h-6 w-40 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <SkeletonBase className="h-4 w-20 mb-2" />
                <SkeletonBase className="h-5 w-32" />
              </div>
            ))}
          </div>
        </div>

        {/* Detalhes do serviço */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <SkeletonBase className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            <div>
              <SkeletonBase className="h-4 w-24 mb-2" />
              <SkeletonBase className="h-20 w-full" />
            </div>
            <div>
              <SkeletonBase className="h-4 w-28 mb-2" />
              <SkeletonBase className="h-20 w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <SkeletonBase className="h-6 w-24 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <SkeletonBase className="h-4 w-20" />
                <SkeletonBase className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Skeleton para página de criação de OS
 */
export const OSCreateSkeleton = () => (
  <div className="p-4 md:p-8 space-y-6">
    {/* Header */}
    <div>
      <SkeletonBase className="h-8 w-40 mb-2" />
      <SkeletonBase className="h-4 w-64" />
    </div>

    {/* Formulário */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <SkeletonBase className="h-4 w-24 mb-2" />
            <SkeletonBase className="h-10 w-full" />
          </div>
        ))}
      </div>
      
      <div className="mt-6">
        <SkeletonBase className="h-4 w-32 mb-2" />
        <SkeletonBase className="h-24 w-full" />
      </div>
      
      <div className="flex justify-end gap-3 mt-6">
        <SkeletonBase className="h-10 w-24" />
        <SkeletonBase className="h-10 w-32" />
      </div>
    </div>
  </div>
);

/**
 * Skeleton para página de edição de OS
 */
export const OSEditSkeleton = () => (
  <div className="p-4 md:p-8 space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div>
        <SkeletonBase className="h-8 w-48 mb-2" />
        <SkeletonBase className="h-4 w-32" />
      </div>
      <SkeletonBase className="h-10 w-28" />
    </div>

    {/* Abas */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex border-b border-gray-200">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-6 py-4">
            <SkeletonBase className="h-4 w-20" />
          </div>
        ))}
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <SkeletonBase className="h-4 w-24 mb-2" />
              <SkeletonBase className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Botões de ação */}
    <div className="flex justify-end gap-3">
      <SkeletonBase className="h-10 w-24" />
      <SkeletonBase className="h-10 w-32" />
    </div>
  </div>
);

/**
 * Skeleton rápido para loading states menores
 */
export const OSQuickSkeleton = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Export individual components
export { OSListSkeleton as OSFullPageSkeleton };