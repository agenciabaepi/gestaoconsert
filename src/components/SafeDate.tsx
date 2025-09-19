'use client';

import { useEffect, useState } from 'react';

interface SafeDateProps {
  date?: Date;
  format?: 'datetime' | 'date' | 'time';
  locale?: string;
  fallback?: React.ReactNode;
}

export function SafeDate({
  date = new Date(),
  format = 'datetime',
  locale = 'pt-BR',
  fallback = null
}: SafeDateProps) {
  const [mounted, setMounted] = useState(false);
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    setMounted(true);

    const options: Intl.DateTimeFormatOptions = {};
    
    switch (format) {
      case 'date':
        options.dateStyle = 'short';
        break;
      case 'time':
        options.timeStyle = 'short';
        break;
      case 'datetime':
      default:
        options.dateStyle = 'short';
        options.timeStyle = 'short';
        break;
    }

    setFormattedDate(
      new Intl.DateTimeFormat(locale, options).format(date)
    );
  }, [date, format, locale]);

  if (!mounted) {
    return <>{fallback || 'Carregando...'}</>;
  }

  return <>{formattedDate}</>;
}
