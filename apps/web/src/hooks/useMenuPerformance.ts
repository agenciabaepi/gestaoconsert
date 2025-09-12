'use client';

import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: number;
}

export const useMenuPerformance = (componentName: string) => {
  const renderStartTime = useRef<number>(Date.now());
  const metricsRef = useRef<PerformanceMetrics[]>([]);

  // Medir tempo de renderização
  const measureRenderTime = useCallback(() => {
    const renderTime = Date.now() - renderStartTime.current;
    
    const metrics: PerformanceMetrics = {
      renderTime,
      componentName,
      timestamp: Date.now()
    };

    metricsRef.current.push(metrics);

    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${componentName} renderizado em ${renderTime}ms`);
    }

    // Manter apenas os últimos 10 registros
    if (metricsRef.current.length > 10) {
      metricsRef.current = metricsRef.current.slice(-10);
    }
  }, [componentName]);

  // Executar medição após renderização
  useEffect(() => {
    measureRenderTime();
  });

  // Reset do timer a cada renderização
  useEffect(() => {
    renderStartTime.current = Date.now();
  });

  // Retornar métricas para análise
  const getMetrics = useCallback(() => {
    return metricsRef.current;
  }, []);

  const getAverageRenderTime = useCallback(() => {
    if (metricsRef.current.length === 0) return 0;
    
    const total = metricsRef.current.reduce((sum, metric) => sum + metric.renderTime, 0);
    return total / metricsRef.current.length;
  }, []);

  return {
    getMetrics,
    getAverageRenderTime,
    measureRenderTime
  };
};