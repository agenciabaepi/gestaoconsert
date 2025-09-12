import { useRef, useEffect } from 'react';

interface RenderInfo {
  component: string;
  renderCount: number;
  lastRender: Date;
  props?: any;
}

const renderStats = new Map<string, RenderInfo>();

export const useRenderTracker = (componentName: string, props?: any) => {
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());
  
  useEffect(() => {
    renderCount.current += 1;
    const now = new Date();
    
    renderStats.set(componentName, {
      component: componentName,
      renderCount: renderCount.current,
      lastRender: now,
      props: props ? JSON.stringify(props) : undefined
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 ${componentName} renderizado ${renderCount.current}x`, {
        props,
        timeSinceMount: Date.now() - startTime.current
      });
    }
  });
  
  return {
    renderCount: renderCount.current,
    getRenderStats: () => Array.from(renderStats.values())
  };
};

export const clearRenderStats = () => {
  renderStats.clear();
};

export const getRenderStats = () => {
  return Array.from(renderStats.values()).sort((a, b) => b.renderCount - a.renderCount);
};