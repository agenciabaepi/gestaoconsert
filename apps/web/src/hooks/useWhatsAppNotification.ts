import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

// Interface removida pois não está sendo usada

export function useWhatsAppNotification() {
  const { empresaData } = useAuth();

  useEffect(() => {
    if (!empresaData?.id) {
      return;
    }

    // TESTE: Vamos primeiro testar se o canal está funcionando
    const testChannel = supabase
      .channel('test-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ordens_servico'
      }, (payload: any) => {
        })
      .subscribe((status: any) => {
        });

    // Canal para monitorar novas OS
    const channel = supabase
      .channel('whatsapp-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ordens_servico',
          filter: `empresa_id=eq.${empresaData.id}`
        },
        async (payload: any) => {
          try {
            console.log('Nova OS recebida:', payload);
            const novaOS = payload.new as any;
            
            // Verificar se temos os dados necessários
            if (!novaOS.tecnico_id || !novaOS.marca || !novaOS.modelo) {
              console.error('❌ WhatsApp: Dados insuficientes na OS!');
              console.error('❌ WhatsApp: tecnico_id:', novaOS.tecnico_id);
              console.error('❌ WhatsApp: marca:', novaOS.marca);
              console.error('❌ WhatsApp: modelo:', novaOS.modelo);
              console.error('❌ WhatsApp: Estrutura completa da OS:', novaOS);
              return;
            }
            
            // Buscar informações do técnico - usando a mesma lógica do cadastro da OS
            const { data: tecnico, error: tecnicoError } = await supabase
              .from('usuarios')
              .select('nome, whatsapp, whatsapp_numero, tecnico_id, auth_user_id')
              .or(`id.eq.${novaOS.tecnico_id},tecnico_id.eq.${novaOS.tecnico_id}`)
              .eq('empresa_id', empresaData.id)
              .single();

            if (tecnicoError || !tecnico) {
              console.error('❌ WhatsApp: Erro ao buscar técnico:', tecnicoError);
              console.error('❌ WhatsApp: Técnico ID:', novaOS.tecnico_id);
              console.error('❌ WhatsApp: Tipo do tecnico_id:', typeof novaOS.tecnico_id);
              console.error('❌ WhatsApp: Técnico encontrado:', tecnico);
              
              // Vamos verificar se o técnico existe na tabela usuarios
              const { data: todosUsuarios, error: usuariosError } = await supabase
                .from('usuarios')
                .select('id, nome, empresa_id, tecnico_id, auth_user_id, whatsapp, whatsapp_numero')
                .eq('empresa_id', empresaData.id);
              
              return;
            }

            // Usar o campo whatsapp (que tem valor) em vez de whatsapp_numero (que está null)
            const numeroWhatsApp = tecnico.whatsapp_numero || tecnico.whatsapp;
            
            if (!numeroWhatsApp) {
              return;
            }

            // Preparar dados para envio (usando dados da OS diretamente)
            const aparelhoInfo = {
              id: novaOS.id,
              marca: novaOS.marca || 'Não informado',
              modelo: novaOS.modelo || 'Não informado',
              cliente_nome: 'Cliente da OS', // Podemos buscar o cliente se necessário
              problema: novaOS.problema_relatado || 'Problema não especificado',
              tecnico_id: novaOS.tecnico_id,
              os_id: novaOS.id
            };

            // Preparar dados para envio
            const dadosEnvio = {
              empresa_id: empresaData.id,
              tecnico_id: novaOS.tecnico_id,
              aparelho_info: aparelhoInfo
            };

            try {
              // Enviar mensagem via WhatsApp
              const response = await fetch('/api/whatsapp/enviar', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(dadosEnvio),
              });

              if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ WhatsApp: Erro ao enviar mensagem:', errorData);
                console.error('❌ WhatsApp: Status da resposta:', response.status);
                console.error('❌ WhatsApp: Headers da resposta:', response.headers);
                console.error('❌ WhatsApp: Dados enviados:', dadosEnvio);
              } else {
                const result = await response.json();
                }
            } catch (fetchError) {
              console.error('❌ WhatsApp: Erro na chamada da API:', fetchError);
              console.error('❌ WhatsApp: Tipo do erro:', typeof fetchError);
              console.error('❌ WhatsApp: Mensagem do erro:', (fetchError as any)?.message || 'Erro desconhecido');
            }

          } catch (error) {
            console.error('❌ WhatsApp: Erro ao processar notificação:', error);
          }
        }
      )
      .subscribe((status: any) => {
        });

    return () => {
      supabase.removeChannel(testChannel);
      supabase.removeChannel(channel);
    };
  }, [empresaData?.id]);

  return null;
}
