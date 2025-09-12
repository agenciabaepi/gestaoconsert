import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresa_id');

    if (!empresaId) {
      return NextResponse.json({ 
        ok: false, 
        error: 'empresa_id é obrigatório' 
      }, { status: 400 });
    }

    // Busca todas as notificações da empresa
    const { data: todasNotificacoes, error: errorTodas } = await admin
      .from('notificacoes')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    if (errorTodas) {
      return NextResponse.json({ 
        ok: false, 
        error: `Erro ao buscar todas as notificações: ${errorTodas.message}` 
      }, { status: 500 });
    }

    // Busca especificamente as de reparo concluído
    const { data: reparoConcluido, error: errorReparo } = await admin
      .from('notificacoes')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('tipo', 'reparo_concluido')
      .order('created_at', { ascending: false });

    if (errorReparo) {
      return NextResponse.json({ 
        ok: false, 
        error: `Erro ao buscar reparo concluído: ${errorReparo.message}` 
      }, { status: 500 });
    }

    // Verifica estrutura da tabela
    const { data: estrutura, error: errorEstrutura } = await admin
      .from('notificacoes')
      .select('*')
      .limit(1);

    return NextResponse.json({
      ok: true,
      debug: {
        empresa_id: empresaId,
        estrutura_tabela: estrutura && estrutura.length > 0 ? Object.keys(estrutura[0]) : [],
        total_notificacoes: todasNotificacoes?.length || 0,
        total_reparo_concluido: reparoConcluido?.length || 0,
        todas_notificacoes: todasNotificacoes,
        reparo_concluido: reparoConcluido
      }
    });

  } catch (e: any) {
    return NextResponse.json({ 
      ok: false, 
      error: String(e?.message || e) 
    }, { status: 500 });
  }
}
