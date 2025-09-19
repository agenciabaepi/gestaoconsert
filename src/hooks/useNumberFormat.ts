import { useMemo } from 'react';

// Função utilitária para formatação consistente
export function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR');
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function useNumberFormat(value: number, locale: string = 'pt-BR') {
  return useMemo(() => {
    return value.toLocaleString(locale);
  }, [value, locale]);
}

export function useCurrencyFormat(value: number, locale: string = 'pt-BR') {
  return useMemo(() => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }, [value, locale]);
}
