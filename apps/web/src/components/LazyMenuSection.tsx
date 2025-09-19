'use client';

import React, { Suspense, lazy, useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface LazyMenuSectionProps {
  title: string;
  icon: React.ReactNode;
  isExpanded?: boolean;
  loadComponent: () => Promise<{ default: React.ComponentType<any> }>;
  componentProps?: any;
  fallback?: React.ReactNode;
  priority?: 'high' | 'medium' | 'low';
}

const LazyMenuSection: React.FC<LazyMenuSectionProps> = ({
  title,
  icon,
  isExpanded = false,
  loadComponent,
  componentProps = {},
  fallback,
  priority = 'medium'
}) => {
  const [expanded, setExpanded] = useState(isExpanded);
  const [shouldLoad, setShouldLoad] = useState(priority === 'high');
  const [LazyComponent, setLazyComponent] = useState<React.ComponentType<any> | null>(null);

  // Carregamento baseado em prioridade
  useEffect(() => {
    if (priority === 'high') {
      // Componentes de alta prioridade carregam imediatamente
      loadComponent().then(module => {
        setLazyComponent(() => module.default);
      });
    } else if (priority === 'medium') {
      // Componentes de média prioridade carregam após um delay
      const timer = setTimeout(() => {
        setShouldLoad(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
    // Componentes de baixa prioridade só carregam quando expandidos
  }, [priority, loadComponent]);

  // Carregamento sob demanda quando expandido
  useEffect(() => {
    if (expanded && !LazyComponent && !shouldLoad) {
      setShouldLoad(true);
    }
  }, [expanded, LazyComponent, shouldLoad]);

  // Carregamento do componente
  useEffect(() => {
    if (shouldLoad && !LazyComponent) {
      loadComponent().then(module => {
        setLazyComponent(() => module.default);
      }).catch(error => {
        console.error(`Erro ao carregar componente ${title}:`, error);
      });
    }
  }, [shouldLoad, LazyComponent, loadComponent, title]);

  const DefaultFallback = () => (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
      <span className="ml-2 text-sm text-gray-500">Carregando...</span>
    </div>
  );

  return (
    <div className="menu-section">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full p-3 text-left hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center">
          {icon}
          <span className="ml-3 font-medium">{title}</span>
        </div>
        {expanded ? (
          <ChevronDownIcon className="h-4 w-4" />
        ) : (
          <ChevronRightIcon className="h-4 w-4" />
        )}
      </button>
      
      {expanded && (
        <div className="ml-6 border-l border-gray-200 pl-4">
          {LazyComponent ? (
            <LazyComponent {...componentProps} />
          ) : shouldLoad ? (
            <Suspense fallback={fallback || <DefaultFallback />}>
              {LazyComponent && <LazyComponent {...componentProps} />}
            </Suspense>
          ) : (
            fallback || <DefaultFallback />
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(LazyMenuSection);