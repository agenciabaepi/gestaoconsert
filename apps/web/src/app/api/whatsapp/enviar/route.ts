import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'whatsapp-web.js';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Declaração global para clientes ativos
declare global {
  var activeClients: Map<string, Client>;
}

export async function POST(request: NextRequest) {
  try {
    const { empresa_id, numero, mensagem } = await request.json();

    if (!empresa_id || !numero || !mensagem) {
      return NextResponse.json(
        { error: 'Empresa ID, número e mensagem são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se há uma sessão ativa
    const { data: session, error: sessionError } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('empresa_id', empresa_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Sessão WhatsApp não encontrada' },
        { status: 404 }
      );
    }

    if (session.status !== 'connected') {
      return NextResponse.json(
        { error: 'WhatsApp não está conectado' },
        { status: 400 }
      );
    }

    // Verificar se o cliente está ativo
    if (!global.activeClients || !global.activeClients.has(empresa_id)) {
      return NextResponse.json(
        { error: 'Cliente WhatsApp não está ativo' },
        { status: 400 }
      );
    }

    const client = global.activeClients.get(empresa_id)!;

    // Enviar mensagem
    const result = await client.sendMessage(numero + '@c.us', mensagem);

    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada com sucesso!',
      message_id: result.id._serialized
    });

  } catch (error) {
    console.error('❌ WhatsApp: Erro ao enviar mensagem:', error);
    
    // Garantir que a resposta JSON seja válida
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        message: errorMessage,
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
