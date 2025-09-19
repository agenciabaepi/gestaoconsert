'use client';

import React, { useState, useEffect } from 'react';
import { getRenderStats, clearRenderStats } from '@/hooks/useRenderTracker';

interface PerformanceMonitorProps {
  isVisible?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  isVisible = false 
}) => {
  const [stats, setStats] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(isVisible);

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setStats(getRenderStats());
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg z-50"
        title="Abrir Monitor de Performance"
      >
        📊
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-auto z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm">Monitor de Re-renderizações</h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              clearRenderStats();
              setStats([]);
            }}
            className="text-xs bg-red-500 text-white px-2 py-1 rounded"
          >
            Limpar
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-xs bg-gray-500 text-white px-2 py-1 rounded"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        {stats.length === 0 ? (
          <p className="text-xs text-gray-500">Nenhuma renderização detectada</p>
        ) : (
          stats.map((stat, index) => (
            <div key={index} className="text-xs border-b pb-1">
              <div className="flex justify-between">
                <span className="font-medium">{stat.component}</span>
                <span className={`px-1 rounded ${
                  stat.renderCount > 5 ? 'bg-red-100 text-red-600' :
                  stat.renderCount > 2 ? 'bg-yellow-100 text-yellow-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {stat.renderCount}x
                </span>
              </div>
              <div className="text-gray-500">
                Último: {stat.lastRender.toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default React.memo(PerformanceMonitor);