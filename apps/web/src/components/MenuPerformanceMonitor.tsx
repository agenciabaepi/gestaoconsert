'use client';

import React, { useState, useEffect } from 'react';
import { useMenuPerformance } from '@/hooks/useMenuPerformance';

interface MenuPerformanceMonitorProps {
  enabled?: boolean;
}

const MenuPerformanceMonitor: React.FC<MenuPerformanceMonitorProps> = ({ 
  enabled = process.env.NODE_ENV === 'development' 
}) => {
  const { getMetrics, getAverageRenderTime } = useMenuPerformance('MenuLayout');
  const [showMetrics, setShowMetrics] = useState(false);
  const [metrics, setMetrics] = useState<any[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      setMetrics(getMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, getMetrics]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setShowMetrics(!showMetrics)}
        className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs hover:bg-blue-700 transition-colors"
      >
        📊 Performance
      </button>
      
      {showMetrics && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80">
          <h3 className="font-semibold text-sm mb-2">Menu Performance</h3>
          
          <div className="text-xs space-y-1">
            <div>Tempo médio: {getAverageRenderTime().toFixed(2)}ms</div>
            <div>Total de renders: {metrics.length}</div>
          </div>
          
          <div className="mt-3 max-h-32 overflow-y-auto">
            <div className="text-xs font-medium mb-1">Últimos renders:</div>
            {metrics.slice(-5).map((metric, index) => (
              <div key={index} className="text-xs text-gray-600">
                {metric.componentName}: {metric.renderTime}ms
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(MenuPerformanceMonitor);