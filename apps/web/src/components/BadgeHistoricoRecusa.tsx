'use client';

import { verificarHistoricoRecusa, getBadgeRecusa } from '@/utils/osHistorico';

interface BadgeHistoricoRecusaProps {
  observacoes?: string | null;
  className?: string;
}

export default function BadgeHistoricoRecusa({ observacoes, className = '' }: BadgeHistoricoRecusaProps) {
  const historico = verificarHistoricoRecusa(observacoes);
  const badge = getBadgeRecusa(historico);

  if (!badge) return null;

  return (
    <div className={`group relative inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${badge.cor} ${className}`}>
      {/* Ícone sempre visível */}
      <span className="flex-shrink-0">{badge.icone}</span>
      
      {/* Texto responsivo - oculto em telas pequenas */}
      <span className="hidden sm:inline whitespace-nowrap">{badge.texto}</span>
      
      {/* Texto compacto para mobile */}
      <span className="sm:hidden">RECUSADO</span>
      
      {/* Tooltip */}
      {badge.tooltip && (
        <div className="invisible group-hover:visible absolute z-20 px-2 py-1 text-xs bg-gray-900 text-white rounded shadow-lg -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          {badge.tooltip}
          {/* Seta do tooltip */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}
