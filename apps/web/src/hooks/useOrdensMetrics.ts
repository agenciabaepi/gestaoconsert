import { useMemo } from 'react';
import { OrdemTransformada } from './useOrdens';

export const useOrdensMetrics = (ordens: OrdemTransformada[]) => {
  const metrics = useMemo(() => {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioSemana = new Date(hoje.setDate(hoje.getDate() - hoje.getDay()));
    const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    
    // Métricas diárias
    const hojeAgora = new Date();
    const inicioDia = new Date(hojeAgora.getFullYear(), hojeAgora.getMonth(), hojeAgora.getDate());
    const fimDia = new Date(hojeAgora.getFullYear(), hojeAgora.getMonth(), hojeAgora.getDate() + 1);

    const osHoje = ordens.filter(os => {
      let dataOS: Date;
      if (typeof os.entrada === 'string') {
        const match = os.entrada.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
          const [, year, month, day] = match;
          dataOS = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          dataOS = new Date(os.entrada);
        }
      } else {
        dataOS = new Date(os.entrada);
      }
      
      return dataOS >= inicioDia && dataOS < fimDia;
    }).length;

    const faturamentoHoje = ordens.filter(os => {
      const dataOS = new Date(os.entrada);
      return dataOS >= inicioDia && dataOS < fimDia && os.valorFaturado;
    }).reduce((sum: number, o: any) => sum + (o.valorFaturado || 0), 0);

    const ticketMedioHoje = osHoje > 0 ? faturamentoHoje / osHoje : 0;

    const retornosHoje = ordens.filter(os => {
      const dataOS = new Date(os.entrada);
      return dataOS >= inicioDia && dataOS < fimDia && os.tipo === 'Retorno';
    }).length;

    const aprovadosHoje = ordens.filter(os => {
      const dataOS = new Date(os.entrada);
      return dataOS >= inicioDia && dataOS < fimDia && 
             (os.statusOS?.toLowerCase() === 'aprovado' || 
              os.statusTecnico?.toLowerCase() === 'aprovado');
    }).length;

    // Métricas gerais
    const totalOS = ordens.length;
    const totalMes = ordens.filter((o: any) => new Date(o.entrada) >= inicioMes).length;
    const retornosMes = ordens.filter((o: any) => o.tipo === 'Retorno' && new Date(o.entrada) >= inicioMes).length;
    const percentualRetornos = totalOS > 0 ? Math.round((retornosMes / totalOS) * 100) : 0;

    // Crescimento
    const ordensSemana = ordens.filter((o: any) => new Date(o.entrada) >= inicioSemana).length;
    const ordensSemanaAnterior = ordens.filter((o: any) => {
      const data = new Date(o.entrada);
      const semanaAnterior = new Date(inicioSemana);
      semanaAnterior.setDate(semanaAnterior.getDate() - 7);
      return data >= semanaAnterior && data < inicioSemana;
    }).length;

    const ordensMesAnterior = ordens.filter((o: any) => {
      const data = new Date(o.entrada);
      return data >= mesAnterior && data < inicioMes;
    }).length;

    const calcPercent = (atual: number, anterior: number) => {
      if (anterior === 0) return atual > 0 ? 100 : 0;
      return Math.round(((atual - anterior) / anterior) * 100);
    };

    return {
      totalOS,
      percentualRetornos,
      osHoje,
      faturamentoHoje,
      ticketMedioHoje,
      retornosHoje,
      aprovadosHoje,
      totalMes,
      retornosMes,
      ordensSemana,
      ordensSemanaAnterior,
      ordensMesAnterior,
      crescimentoSemanal: calcPercent(ordensSemana, ordensSemanaAnterior),
      crescimentoMensal: calcPercent(totalMes, ordensMesAnterior)
    };
  }, [ordens]);

  return metrics;
};