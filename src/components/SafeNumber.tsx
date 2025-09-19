'use client';

import { useEffect, useState } from 'react';

interface SafeNumberProps {
  value: number;
  format?: 'number' | 'currency';
  locale?: string;
  fallback?: React.ReactNode;
}

export function SafeNumber({ 
  value, 
  format = 'number', 
  locale = 'pt-BR',
  fallback = null 
}: SafeNumberProps) {
  const [mounted, setMounted] = useState(false);
  const [formattedValue, setFormattedValue] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    
    if (format === 'currency') {
      setFormattedValue(
        new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: 'BRL',
        }).format(value)
      );
    } else {
      setFormattedValue(value.toLocaleString(locale));
    }
  }, [value, format, locale]);

  if (!mounted) {
    return <>{fallback || value.toString()}</>;
  }

  return <>{formattedValue}</>;
}
