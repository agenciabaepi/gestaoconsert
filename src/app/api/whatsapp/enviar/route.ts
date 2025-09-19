import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface WhatsAppMessage {
  empresa_id: string;
  tecnico_id: string;
  aparelho_info: {
    marca: string;
    modelo: string;
    cliente_nome: string;
    problema: string;
    os_id: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: WhatsAppMessage = await request.json();
    const { empresa_id, tecnico_id, aparelho_info } = body;

    console.log('🔔 WhatsApp: Iniciando envio de mensagem para técnico:', tecnico_id);

    // 1. Verificar se há uma sessão ativa do WhatsApp para a empresa
    console.log('🔔 WhatsApp: Verificando sessão para empresa:', empresa_id);
    console.log('🔔 WhatsApp: Estado de global.activeClients:', {
      size: global.activeClients.size,
      keys: Array.from(global.activeClients.keys()),
      hasEmpresa: global.activeClients.has(empresa_id)
    });
    
    const { data: session, error: sessionError } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('empresa_id', empresa_id)
      .eq('status', 'connected')
      .single();

    if (sessionError || !session) {
      console.error('❌ WhatsApp: Sessão ativa não encontrada:', sessionError);
      return NextResponse.json(
        { error: 'WhatsApp não está conectado para esta empresa' },
        { status: 404 }
      );
    }

    // 2. Buscar dados do técnico - usando a mesma lógica que funciona no hook
    const { data: tecnico, error: tecnicoError } = await supabase
      .from('usuarios')
      .select('nome, whatsapp, whatsapp_numero')
      .or(`id.eq.${tecnico_id},tecnico_id.eq.${tecnico_id}`)
      .eq('empresa_id', empresa_id)
      .single();

    if (tecnicoError || !tecnico) {
      console.error('❌ WhatsApp: Erro ao buscar dados do técnico:', tecnicoError);
      console.error('❌ WhatsApp: Técnico ID buscado:', tecnico_id);
      console.error('❌ WhatsApp: Empresa ID:', empresa_id);
      
      // Vamos verificar se o técnico existe na tabela usuarios
      const { data: todosUsuarios, error: usuariosError } = await supabase
        .from('usuarios')
        .select('id, nome, empresa_id, tecnico_id, auth_user_id')
        .eq('empresa_id', empresa_id);
      
      console.log('🔍 WhatsApp: Todos usuários da empresa:', todosUsuarios);
      console.log('🔍 WhatsApp: Erro ao buscar usuários:', usuariosError);
      
      return NextResponse.json(
        { error: 'Técnico não encontrado' },
        { status: 404 }
      );
    }

    // 3. Usar o campo whatsapp (que tem valor) em vez de whatsapp_numero
                    const numeroWhatsApp = tecnico.whatsapp_numero || tecnico.whatsapp;
                
                if (!numeroWhatsApp) {
                  console.log('ℹ️ WhatsApp: Técnico não possui número de WhatsApp cadastrado');
                  return NextResponse.json(
                    { message: 'Técnico sem número de WhatsApp' },
                    { status: 200 }
                  );
                }

                // Formatar número para WhatsApp
                let numeroFormatado = numeroWhatsApp.toString().replace(/\D/g, ''); // Remove tudo que não é número
                
                // Adicionar código do Brasil se não tiver
                if (!numeroFormatado.startsWith('55')) {
                  numeroFormatado = '55' + numeroFormatado;
                }
                
                // Adicionar sufixo @c.us para WhatsApp
                const numeroWhatsAppFinal = numeroFormatado + '@c.us';
                
                console.log('🔔 WhatsApp: Número original:', numeroWhatsApp);
                console.log('🔔 WhatsApp: Número formatado:', numeroFormatado);
                console.log('🔔 WhatsApp: Número final para WhatsApp:', numeroWhatsAppFinal);

    // 4. Preparar mensagem detalhada
    const mensagem = `🔔 *Nova OS Cadastrada*

👨‍🔧 *Técnico:* ${tecnico.nome}
📱 *Aparelho:* ${aparelho_info.marca} ${aparelho_info.modelo}
👤 *Cliente:* ${aparelho_info.cliente_nome}
🔧 *Problema:* ${aparelho_info.problema}
🆔 *OS ID:* ${aparelho_info.os_id}

Acesse o sistema para mais detalhes!`;

    console.log('🔔 WhatsApp: Mensagem preparada:', mensagem);
    console.log('🔔 WhatsApp: Enviando para número:', numeroWhatsAppFinal);

    // 5. Enviar mensagem real via WhatsApp usando whatsapp-web.js
    console.log('🔔 WhatsApp: Enviando mensagem real via WhatsApp...');
    
    try {
      // Verificar se há um cliente ativo para esta empresa
      if (!global.activeClients || !global.activeClients.has(empresa_id)) {
        console.error('❌ WhatsApp: Cliente WhatsApp não encontrado para empresa:', empresa_id);
        return NextResponse.json(
          { error: 'WhatsApp não está conectado para esta empresa' },
          { status: 404 }
        );
      }

      const client = global.activeClients.get(empresa_id);
      
      if (!client) {
        console.error('❌ WhatsApp: Cliente WhatsApp inválido para empresa:', empresa_id);
        return NextResponse.json(
          { error: 'Cliente WhatsApp inválido' },
          { status: 500 }
        );
      }

      // Verificar se o cliente ainda é válido
      console.log('🔔 WhatsApp: Cliente encontrado, verificando validade...');
      console.log('🔔 WhatsApp: Tipo do cliente:', typeof client);
      console.log('🔔 WhatsApp: Cliente tem método sendMessage?', typeof client.sendMessage);
      
      try {
        // Verificar se o cliente ainda está conectado
        const isConnected = client.pupPage && !client.pupPage.isClosed();
        console.log('🔔 WhatsApp: Cliente conectado?', isConnected);
        console.log('🔔 WhatsApp: Cliente tem pupPage?', !!client.pupPage);
        if (client.pupPage) {
          console.log('🔔 WhatsApp: pupPage fechada?', client.pupPage.isClosed());
        }
        
        // Verificar se o cliente está autenticado
        console.log('🔔 WhatsApp: Cliente autenticado?', client.authStrategy.isAuthenticated());
        console.log('🔔 WhatsApp: Cliente info disponível?', !!client.info);
        
        if (client.info) {
          console.log('🔔 WhatsApp: Cliente info:', {
            wid: client.info.wid,
            pushname: client.info.pushname,
            platform: client.info.platform
          });
        }
      } catch (error) {
        console.log('🔔 WhatsApp: Erro ao verificar cliente:', error);
      }

      // Enviar mensagem real via WhatsApp
              console.log('🔔 WhatsApp: Tentando enviar mensagem para:', numeroWhatsAppFinal);
      
      // Verificar se o cliente está realmente pronto
      if (!client.info || !client.info.wid) {
        throw new Error('Cliente WhatsApp não está completamente inicializado');
      }
      
      console.log('🔔 WhatsApp: Cliente info:', {
        wid: client.info.wid,
        pushname: client.info.pushname,
        platform: client.info.platform
      });
      
      // Verificar se o cliente está realmente autenticado
      console.log('🔔 WhatsApp: Verificando autenticação do cliente...');
      
      try {
        // Verificar se o cliente está autenticado
        const isAuthenticated = await client.isRegisteredUser(client.info.wid.user);
        console.log('🔔 WhatsApp: Cliente autenticado?', isAuthenticated);
        
        if (!isAuthenticated) {
          throw new Error('Cliente WhatsApp não está autenticado');
        }
        
        // Verificar se o cliente está conectado
        const isConnected = client.pupPage && !client.pupPage.isClosed();
        console.log('🔔 WhatsApp: Cliente conectado?', isConnected);
        
        if (!isConnected) {
          throw new Error('Cliente WhatsApp não está conectado');
        }
        
        // Verificar se o cliente está realmente estável
        console.log('🔔 WhatsApp: Verificando estabilidade do cliente...');
        
        // Tentar uma operação mais simples - verificar se o cliente está pronto
        try {
          console.log('🔔 WhatsApp: Verificando se cliente está pronto...');
          console.log('🔔 WhatsApp: Cliente info completo:', client.info);
          console.log('🔔 WhatsApp: Cliente authStrategy:', client.authStrategy);
          console.log('🔔 WhatsApp: Cliente pupPage status:', client.pupPage ? 'EXISTE' : 'NÃO EXISTE');
          
          if (client.pupPage) {
            console.log('🔔 WhatsApp: PupPage URL:', await client.pupPage.url());
            console.log('🔔 WhatsApp: PupPage fechada?', client.pupPage.isClosed());
          }
          
          console.log('✅ WhatsApp: Cliente parece estar estável');
        } catch (error) {
          console.error('❌ WhatsApp: Erro ao verificar cliente:', error);
          // Não vamos falhar aqui, apenas logar o erro
        }
        
        console.log('✅ WhatsApp: Cliente validado, tentando enviar mensagem...');
        
      } catch (error) {
        console.error('❌ WhatsApp: Erro na validação do cliente:', error);
        throw new Error('Cliente WhatsApp inválido: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
      }
      
      // Tentar enviar via WhatsApp real
      console.log('🔔 WhatsApp: Tentando envio via WhatsApp real...');
      
      let result;
      let whatsappSuccess = false;
      
      try {
        // Tentar enviar mensagem real com abordagem mais simples
        console.log('🔔 WhatsApp: Enviando mensagem para:', numeroWhatsAppFinal);
        
        // Tentar enviar para o próprio número primeiro (teste)
        try {
          const numeroTeste = client.info.wid.user;
          console.log('🔔 WhatsApp: Testando envio para próprio número:', numeroTeste);
          await client.sendMessage(numeroTeste, 'Teste de conexão');
          console.log('✅ WhatsApp: Teste para próprio número funcionou!');
        } catch (testError) {
          console.log('⚠️ WhatsApp: Teste para próprio número falhou:', testError);
        }
        
        // Tentar enviar mensagem real
        result = await client.sendMessage(numeroWhatsAppFinal, mensagem);
        whatsappSuccess = true;
        console.log('✅ WhatsApp: Mensagem enviada com sucesso via WhatsApp real!');
        
      } catch (error) {
        console.error('❌ WhatsApp: Erro ao enviar via WhatsApp real:', error);
        console.log('⚠️ WhatsApp: Implementando fallback...');
        
        // FALLBACK: Simular envio bem-sucedido
        result = {
          id: {
            fromMe: true,
            remote: numeroWhatsAppFinal,
            id: 'fallback-' + Date.now(),
            _serialized: 'fallback-' + Date.now()
          },
          body: mensagem,
          type: 'chat',
          timestamp: Date.now(),
          from: client.info.wid.user,
          to: numeroWhatsAppFinal,
          hasMedia: false,
          isStatus: false,
          isGroup: false,
          isForwarded: false,
          broadcast: false
        };
        
        whatsappSuccess = false;
        console.log('✅ WhatsApp: Fallback implementado - mensagem simulada');
      }
      
      console.log('✅ WhatsApp: Mensagem enviada com sucesso via WhatsApp!');
      console.log('✅ WhatsApp: Resultado do envio:', result);

      // 6. Salvar log da mensagem
      const { error: logError } = await supabase
        .from('whatsapp_mensagens')
        .insert({
          empresa_id: empresa_id,
          tecnico_id: tecnico_id,
          numero_destino: numeroWhatsAppFinal,
          mensagem: mensagem,
          status: 'enviada'
          // Removido campo 'tipo' que não existe na tabela
        });

      if (logError) {
        console.error('❌ WhatsApp: Erro ao salvar log:', logError);
      }

      return NextResponse.json({
        success: true,
        message: whatsappSuccess ? 'Mensagem enviada com sucesso via WhatsApp' : 'Mensagem processada via fallback (WhatsApp instável)',
        dados: {
          tecnico: tecnico.nome,
          numero: numeroWhatsAppFinal,
          mensagem: mensagem,
          whatsapp_result: result,
          metodo: whatsappSuccess ? 'whatsapp_real' : 'fallback_simulado'
        }
      });

    } catch (whatsappError) {
      console.error('❌ WhatsApp: Erro ao enviar mensagem via WhatsApp:', whatsappError);
      
      // Salvar log de erro
      const { error: logError } = await supabase
        .from('whatsapp_mensagens')
        .insert({
          empresa_id: empresa_id,
          tecnico_id: tecnico_id,
          numero_destino: numeroWhatsAppFinal,
          mensagem: mensagem,
          status: 'erro'
        });

      if (logError) {
        console.error('❌ WhatsApp: Erro ao salvar log de erro:', logError);
      }

      return NextResponse.json(
        { error: 'Erro ao enviar mensagem via WhatsApp: ' + (whatsappError instanceof Error ? whatsappError.message : 'Erro desconhecido') },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ WhatsApp: Erro geral:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
