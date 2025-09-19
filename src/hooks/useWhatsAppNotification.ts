import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

// Interface removida pois não está sendo usada

export function useWhatsAppNotification() {
  const { empresaData } = useAuth();

  useEffect(() => {
    console.log('🔔 WhatsApp: Hook inicializado para empresa:', empresaData?.id);
    console.log('🔔 WhatsApp: Hook executado em:', new Date().toISOString());
    console.log('🔔 WhatsApp: empresaData completo:', empresaData);
    
    if (!empresaData?.id) {
      console.log('🔔 WhatsApp: Empresa não encontrada, saindo...');
      return;
    }

    console.log('🔔 WhatsApp: Configurando canal de notificações...');

    // TESTE: Vamos primeiro testar se o canal está funcionando
    const testChannel = supabase
      .channel('test-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ordens_servico'
      }, (payload) => {
        console.log('🔔 WhatsApp: 🚨 MUDANÇA DETECTADA! 🚨');
        console.log('🔔 WhatsApp: Evento:', payload.eventType);
        console.log('🔔 WhatsApp: Tabela:', payload.table);
        console.log('🔔 WhatsApp: Dados:', payload.new);
      })
      .subscribe((status) => {
        console.log('🔔 WhatsApp: Status do canal de teste:', status);
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
        async (payload) => {
          try {
            console.log('🔔 WhatsApp: 🚨 NOVA OS DETECTADA! 🚨');
            console.log('🔔 WhatsApp: Payload completo:', payload);
            console.log('🔔 WhatsApp: Nova OS:', payload.new);
            console.log('🔔 WhatsApp: Tipo do payload.new:', typeof payload.new);
            console.log('🔔 WhatsApp: Chaves do payload.new:', Object.keys(payload.new || {}));
            console.log('🔔 WhatsApp: tecnico_id:', payload.new?.tecnico_id);
            console.log('🔔 WhatsApp: cliente_id:', payload.new?.cliente_id);
            console.log('🔔 WhatsApp: empresa_id:', payload.new?.empresa_id);
            console.log('🔔 WhatsApp: marca:', payload.new?.marca);
            console.log('🔔 WhatsApp: modelo:', payload.new?.modelo);
            console.log('🔔 WhatsApp: problema_relatado:', payload.new?.problema_relatado);
            
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
            
            console.log('🔔 WhatsApp: Buscando técnico ID:', novaOS.tecnico_id);

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
              
              console.log('🔍 WhatsApp: Todos usuários da empresa:', todosUsuarios);
              console.log('🔍 WhatsApp: Erro ao buscar usuários:', usuariosError);
              
              return;
            }

            console.log('🔔 WhatsApp: Técnico encontrado:', tecnico);

            // Usar o campo whatsapp (que tem valor) em vez de whatsapp_numero (que está null)
            const numeroWhatsApp = tecnico.whatsapp_numero || tecnico.whatsapp;
            
            if (!numeroWhatsApp) {
              console.log('ℹ️ WhatsApp: Técnico sem número de WhatsApp:', tecnico.nome);
              console.log('ℹ️ WhatsApp: whatsapp:', tecnico.whatsapp);
              console.log('ℹ️ WhatsApp: whatsapp_numero:', tecnico.whatsapp_numero);
              return;
            }

            console.log('🔔 WhatsApp: Número WhatsApp do técnico:', numeroWhatsApp);

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

            console.log('🔔 WhatsApp: Enviando notificação para técnico:', tecnico.nome);
            console.log('🔔 WhatsApp: Dados do aparelho:', aparelhoInfo);
            console.log('🔔 WhatsApp: Número WhatsApp:', numeroWhatsApp);
            console.log('🔔 WhatsApp: Empresa ID:', empresaData.id);
            console.log('🔔 WhatsApp: Técnico ID:', novaOS.tecnico_id);

            // Preparar dados para envio
            const dadosEnvio = {
              empresa_id: empresaData.id,
              tecnico_id: novaOS.tecnico_id,
              aparelho_info: aparelhoInfo
            };

            console.log('🔔 WhatsApp: Dados sendo enviados para API:', dadosEnvio);
            console.log('🔔 WhatsApp: URL da API:', '/api/whatsapp/enviar');
            console.log('🔔 WhatsApp: Iniciando chamada para API...');

            try {
              // Enviar mensagem via WhatsApp
              const response = await fetch('/api/whatsapp/enviar', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(dadosEnvio),
              });

              console.log('🔔 WhatsApp: API chamada com sucesso!');
              console.log('🔔 WhatsApp: Response status:', response.status);
              console.log('🔔 WhatsApp: Response ok:', response.ok);
              console.log('🔔 WhatsApp: Response headers:', response.headers);

              if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ WhatsApp: Erro ao enviar mensagem:', errorData);
                console.error('❌ WhatsApp: Status da resposta:', response.status);
                console.error('❌ WhatsApp: Headers da resposta:', response.headers);
                console.error('❌ WhatsApp: Dados enviados:', dadosEnvio);
              } else {
                const result = await response.json();
                console.log('✅ WhatsApp: Mensagem enviada com sucesso:', result);
              }
            } catch (fetchError) {
              console.error('❌ WhatsApp: Erro na chamada da API:', fetchError);
              console.error('❌ WhatsApp: Tipo do erro:', typeof fetchError);
              console.error('❌ WhatsApp: Mensagem do erro:', fetchError.message);
            }

          } catch (error) {
            console.error('❌ WhatsApp: Erro ao processar notificação:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 WhatsApp: Status do canal:', status);
      });

    console.log('🔔 WhatsApp: Canal configurado com sucesso!');

    return () => {
      console.log('🔔 WhatsApp: Removendo canais...');
      supabase.removeChannel(testChannel);
      supabase.removeChannel(channel);
    };
  }, [empresaData?.id]);

  return null;
}
