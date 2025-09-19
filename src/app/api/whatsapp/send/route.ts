import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Importar o mapa de clientes ativos (em produção, use Redis)
declare global {
  var activeClients: Map<string, any>;
}

if (!global.activeClients) {
  global.activeClients = new Map();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { empresa_id, tecnico_id, aparelho_info } = body;

    if (!empresa_id || !tecnico_id || !aparelho_info) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    console.log('🔔 WhatsApp: Enviando mensagem para empresa:', empresa_id);

    // 1. Verificar se a empresa tem WhatsApp conectado
    const { data: session, error: sessionError } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('empresa_id', empresa_id)
      .single();

    if (sessionError || !session) {
      console.error('❌ WhatsApp: Sessão não encontrada:', sessionError);
      return NextResponse.json(
        { error: 'WhatsApp não conectado para esta empresa' },
        { status: 404 }
      );
    }

    if (session.status !== 'connected') {
      console.log('ℹ️ WhatsApp: WhatsApp não conectado, status:', session.status);
      return NextResponse.json(
        { error: 'WhatsApp não está conectado' },
        { status: 400 }
      );
    }

    // 2. Buscar dados do técnico
    const { data: tecnico, error: tecnicoError } = await supabase
      .from('usuarios')
      .select('nome, whatsapp_numero')
      .eq('id', tecnico_id)
      .single();

    if (tecnicoError || !tecnico) {
      console.error('❌ WhatsApp: Técnico não encontrado:', tecnicoError);
      return NextResponse.json(
        { error: 'Técnico não encontrado' },
        { status: 404 }
      );
    }

    if (!tecnico.whatsapp_numero) {
      console.log('ℹ️ WhatsApp: Técnico sem número de WhatsApp');
      return NextResponse.json(
        { error: 'Técnico não possui número de WhatsApp cadastrado' },
        { status: 400 }
      );
    }

    // 3. Preparar mensagem
    const mensagem = `🔔 *Nova OS Cadastrada*

👨‍🔧 *Técnico:* ${tecnico.nome}
📱 *Aparelho:* ${aparelho_info.marca} ${aparelho_info.modelo}
👤 *Cliente:* ${aparelho_info.cliente_nome}
🔧 *Problema:* ${aparelho_info.problema}
🆔 *OS ID:* ${aparelho_info.os_id}

Acesse o sistema para mais detalhes!`;

    // 4. Enviar mensagem via WhatsApp Web
    try {
      console.log('📤 WhatsApp: Enviando mensagem:', mensagem);
      console.log('📤 WhatsApp: Para número:', tecnico.whatsapp_numero);

      // Enviar mensagem real via WhatsApp Web
      const client = global.activeClients.get(empresa_id);
      if (client) {
        const chatId = `${tecnico.whatsapp_numero}@c.us`;
        await client.sendMessage(chatId, mensagem);
        console.log('✅ WhatsApp: Mensagem enviada com sucesso via WhatsApp Web');
      } else {
        console.log('⚠️ WhatsApp: Cliente não encontrado, mensagem não enviada');
        throw new Error('WhatsApp não está conectado');
      }

      // 5. Registrar mensagem no banco
      const { error: logError } = await supabase
        .from('whatsapp_mensagens')
        .insert({
          empresa_id,
          tecnico_id,
          numero_destino: tecnico.whatsapp_numero,
          mensagem,
          status: 'enviado',
          os_id: aparelho_info.os_id || null
        });

      if (logError) {
        console.error('⚠️ WhatsApp: Erro ao registrar log:', logError);
      }

      console.log('✅ WhatsApp: Mensagem enviada com sucesso');
      return NextResponse.json({
        success: true,
        message: 'Mensagem enviada com sucesso'
      });

    } catch (sendError) {
      console.error('❌ WhatsApp: Erro ao enviar mensagem:', sendError);
      
      // Registrar erro no banco
      await supabase
        .from('whatsapp_mensagens')
        .insert({
          empresa_id,
          tecnico_id,
          numero_destino: tecnico.whatsapp_numero,
          mensagem,
          status: 'erro',
          os_id: aparelho_info.os_id || null
        });

      return NextResponse.json(
        { error: 'Erro ao enviar mensagem via WhatsApp' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ WhatsApp: Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
