import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empresa_id = searchParams.get('empresa_id');

    if (!empresa_id) {
      return NextResponse.json(
        { error: 'Empresa ID é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar status no banco
    const { data: session, error: sessionError } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('empresa_id', empresa_id)
      .single();

    if (sessionError) {
      return NextResponse.json(
        { error: 'Sessão não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se há cliente ativo na memória
    const hasActiveClient = global.activeClients && global.activeClients.has(empresa_id);
    const activeClientInfo = hasActiveClient ? {
      isActive: true,
      clientId: empresa_id
    } : {
      isActive: false,
      clientId: null
    };

    return NextResponse.json({
      success: true,
      session: session,
      activeClient: activeClientInfo,
      globalClientsInfo: {
        totalClients: global.activeClients ? global.activeClients.size : 0,
        clientKeys: global.activeClients ? Array.from(global.activeClients.keys()) : []
      }
    });

  } catch (error) {
    console.error('❌ WhatsApp: Erro ao verificar status:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
