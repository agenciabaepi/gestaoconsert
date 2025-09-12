'use client';

import React from 'react';
import { StatusHistoricoItem } from '@/hooks/useStatusHistorico';
import { FiUser, FiClock, FiMessageSquare, FiChevronRight } from 'react-icons/fi';

interface StatusHistoricoTimelineProps {
  historico: StatusHistoricoItem[];
  loading?: boolean;
  compact?: boolean;
}

export default function StatusHistoricoTimeline({ 
  historico, 
  loading = false, 
  compact = false 
}: StatusHistoricoTimelineProps) {
  
  const formatarTempo = (tempo?: string) => {
    if (!tempo) return null;
    
    // Converter intervalo PostgreSQL para formato legível
    const match = tempo.match(/(\d+):(\d+):(\d+)/);
    if (match) {
      const horas = parseInt(match[1]);
      const minutos = parseInt(match[2]);
      
      if (horas > 24) {
        const dias = Math.floor(horas / 24);
        const horasRestantes = horas % 24;
        return `${dias}d ${horasRestantes}h ${minutos}m`;
      } else if (horas > 0) {
        return `${horas}h ${minutos}m`;
      } else {
        return `${minutos}m`;
      }
    }
    
    return tempo;
  };

  const getStatusColor = (status: string) => {
    const statusUpper = status.toUpperCase();
    
    if (statusUpper.includes('APROVADO') || statusUpper.includes('ENTREGUE')) {
      return {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        dot: 'bg-green-500'
      };
    } else if (statusUpper.includes('RECUS') || statusUpper.includes('CANCEL')) {
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        dot: 'bg-red-500'
      };
    } else if (statusUpper.includes('AGUARDANDO')) {
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-500'
      };
    } else if (statusUpper.includes('ANDAMENTO') || statusUpper.includes('REPARO')) {
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500'
      };
    } else {
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        dot: 'bg-gray-500'
      };
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!historico || historico.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FiClock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Nenhum histórico de status encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {historico.map((item, index) => {
        const colors = getStatusColor(item.status_novo);
        const previousColors = item.status_anterior ? getStatusColor(item.status_anterior) : null;
        
        return (
          <div 
            key={item.id} 
            className={`relative ${index !== historico.length - 1 ? 'pb-3' : ''}`}
          >
            {/* Linha conectora */}
            {index !== historico.length - 1 && (
              <div className="absolute left-5 top-10 w-0.5 h-full bg-gray-200"></div>
            )}
            
            <div className="flex items-start gap-3">
              {/* Indicador de status - mais compacto */}
              <div className="flex-shrink-0 mt-1">
                <div className={`w-10 h-10 ${colors.bg} border-2 ${colors.border} rounded-full flex items-center justify-center`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`}></div>
                </div>
              </div>

              {/* Conteúdo - mais limpo */}
              <div className="flex-1 min-w-0">
                <div className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm hover:shadow-md transition-shadow">
                  {/* Header compacto */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.status_anterior && previousColors && (
                        <>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${previousColors.bg} ${previousColors.text} ${previousColors.border} border`}>
                            {item.status_anterior}
                          </span>
                          <FiChevronRight className="w-3 h-3 text-gray-400" />
                        </>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
                        {item.status_novo}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {formatarData(item.created_at)}
                    </div>
                  </div>

                  {/* Informações principais - mais organizadas */}
                  <div className="space-y-2">
                    {/* Usuário e tempo */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-gray-600">
                      {item.usuario_nome && (
                        <div className="flex items-center gap-1">
                          <FiUser className="w-3 h-3 text-gray-400" />
                          <span className="font-medium">{item.usuario_nome}</span>
                        </div>
                      )}
                      {item.tempo_no_status_anterior && (
                        <div className="flex items-center gap-1">
                          <FiClock className="w-3 h-3 text-gray-400" />
                          <span>Ficou {formatarTempo(item.tempo_no_status_anterior)} no status anterior</span>
                        </div>
                      )}
                    </div>

                    {/* Status técnico (se relevante) */}
                    {item.status_tecnico_novo && item.status_tecnico_novo !== item.status_novo && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500">Técnico:</span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                          {item.status_tecnico_novo}
                        </span>
                      </div>
                    )}

                    {/* Motivo */}
                    {item.motivo && (
                      <div className="text-xs">
                        <span className="text-gray-500">Motivo:</span>
                        <span className="ml-1 text-gray-700 font-medium">{item.motivo}</span>
                      </div>
                    )}

                    {/* Observações */}
                    {item.observacoes && (
                      <div className="flex items-start gap-1 text-xs">
                        <FiMessageSquare className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{item.observacoes}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
