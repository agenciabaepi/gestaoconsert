'use client';

import { useState, useEffect, useRef } from 'react';
import { FiFileText, FiBell, FiEye, FiArrowRight } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

interface OSLaudoPronto {
  id: string;
  numero_os: string;
  cliente: string;
  tecnico: string;
  status_tecnico: string;
  created_at: string;
}

export default function LaudoProntoAlert() {
  const [laudosProntos, setLaudosProntos] = useState<OSLaudoPronto[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const router = useRouter();
  const { empresaData, usuarioData } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousCountRef = useRef(0);

  // Verificar se o usuário tem permissão para ver esta notificação
  const podeVerNotificacao = () => {
    if (!usuarioData?.nivel) return false;
    return usuarioData.nivel === 'admin' || usuarioData.nivel === 'atendente';
  };

  // Função para tocar som de notificação
  const playNotificationSound = () => {
    try {
      // Tentar usar Web Audio API se disponível
      if (typeof window !== 'undefined' && (window as any).createNotificationSound) {
        (window as any).createNotificationSound();
      } else if (audioRef.current) {
        // Fallback para arquivo de áudio
        audioRef.current.play().catch(console.error);
      }
    } catch (error) {
      console.error('Erro ao tocar som:', error);
    }
  };

  // Função para buscar laudos prontos
  const fetchLaudosProntos = async () => {
    if (!empresaData?.id) return;

    const { data, error } = await supabase
      .from('ordens_servico')
      .select(`
        id,
        numero_os,
        created_at,
        status_tecnico,
        clientes:cliente_id(nome),
        tecnico:usuarios!tecnico_id(nome)
      `)
      .eq('empresa_id', empresaData.id)
      .in('status_tecnico', ['ORÇAMENTO ENVIADO', 'AGUARDANDO APROVAÇÃO'])
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Filtrar apenas OSs com status "ORÇAMENTO ENVIADO"
      const laudos = data
        .filter((os: any) => os.status_tecnico === 'ORÇAMENTO ENVIADO')
        .map((os: any) => ({
          id: os.id,
          numero_os: os.numero_os,
          cliente: (os.clientes as any)?.nome || 'Cliente não identificado',
          tecnico: (os.tecnico as any)?.nome || 'Técnico não identificado',
          status_tecnico: os.status_tecnico,
          created_at: os.created_at
        }));

      // Verificar se há novas OSs
      const currentCount = laudos.length;
      const previousCount = previousCountRef.current;
      
      if (currentCount > previousCount && previousCount > 0) {
        // Nova OS adicionada - tocar som e mostrar notificação
        playNotificationSound();
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }

      setLaudosProntos(laudos);
      setIsVisible(laudos.length > 0);
      setIsBlinking(laudos.length > 0);
      previousCountRef.current = currentCount;
    } else if (error) {
      console.error('Erro ao buscar laudos:', error);
    }
  };

  useEffect(() => {
    if (!empresaData?.id) return;

    // Buscar dados iniciais
    fetchLaudosProntos();

    // Testar conexão Realtime primeiro
    const testChannel = supabase
      .channel('test_connection')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ordens_servico'
      }, (payload: any) => {
        })
      .subscribe((status: any) => {
        });

    // Configurar subscription em tempo real
    const channel = supabase
      .channel('laudos_prontos_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ordens_servico',
          filter: `empresa_id=eq.${empresaData.id}`
        },
        (payload: any) => {
          // Atualizar dados quando houver mudanças
          fetchLaudosProntos();
        }
      )
      .subscribe((status: any) => {
        });

    // Cleanup da subscription
    return () => {
      supabase.removeChannel(testChannel);
      supabase.removeChannel(channel);
    };
  }, [empresaData?.id]);

  useEffect(() => {
    if (isBlinking) {
      const blinkInterval = setInterval(() => {
        setIsBlinking(prev => !prev);
      }, 1000);
      return () => clearInterval(blinkInterval);
    }
  }, [isBlinking]);

  // Verificar permissões e visibilidade ANTES de renderizar
  if (!podeVerNotificacao() || !isVisible || laudosProntos.length === 0) {
    return null;
  }

  return (
    <>
      {/* Audio element para som de notificação */}
      <audio ref={audioRef} preload="auto">
        <source src="/notification.mp3" type="audio/mpeg" />
        <source src="/notification.wav" type="audio/wav" />
      </audio>

      {/* Notificação toast */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce">
          <div className="flex items-center gap-2">
            <FiBell className="w-4 h-4" />
            <span className="text-sm font-medium">
              Nova OS com orçamento enviado!
            </span>
          </div>
        </div>
      )}

      {/* Alerta principal */}
      <div className="fixed bottom-4 right-4 z-40 max-w-xs">
        <div className={`
          bg-white border border-gray-200 rounded-lg shadow-lg
          transform transition-all duration-300 hover:shadow-xl
          ${isBlinking ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
        `}>
          {/* Header sutil */}
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className={`
                p-1.5 bg-blue-50 rounded-full
                ${isBlinking ? 'animate-pulse' : ''}
              `}>
                <FiFileText className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Orçamentos Enviados
                </h3>
                <p className="text-xs text-gray-500">
                  {laudosProntos.length} OS{laudosProntos.length > 1 ? 's' : ''} aguardando aprovação
                </p>
              </div>
            </div>
            <div className={`
              p-1 bg-red-50 rounded-full
              ${isBlinking ? 'animate-ping' : ''}
            `}>
              <FiBell className="w-3 h-3 text-red-500" />
            </div>
          </div>

          {/* Lista compacta */}
          <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
            {laudosProntos.slice(0, 3).map((os) => (
              <div 
                key={os.id}
                className="bg-gray-50 rounded-md p-2 hover:bg-gray-100 transition-all cursor-pointer group"
                onClick={() => router.push(`/ordens/${os.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-900 truncate">
                        OS #{os.numero_os}
                      </span>
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        Enviado
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 truncate">
                      {os.cliente}
                    </p>
                  </div>
                  <FiArrowRight className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                </div>
              </div>
            ))}
            
            {laudosProntos.length > 3 && (
              <div className="text-center py-1">
                <span className="text-xs text-gray-500">
                  +{laudosProntos.length - 3} mais...
                </span>
              </div>
            )}
          </div>

          {/* Botão discreto */}
          <div className="p-3 border-t border-gray-100">
            <button
              onClick={() => router.push('/ordens')}
              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium py-1.5 px-3 rounded-md transition-colors flex items-center justify-center gap-1"
            >
              <FiEye className="w-3 h-3" />
              Ver Todas
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
