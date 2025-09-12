import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Buscar assinaturas com trial expirado
    const { data: assinaturasExpiradas, error } = await supabase
      .from('assinaturas')
      .select(`
        id,
        empresa_id,
        plano_id,
        status,
        data_trial_fim,
        proxima_cobranca,
        valor,
        empresas!inner(nome, email_contato),
        planos!inner(nome, valor)
      `)
      .eq('status', 'trial')
      .lt('data_trial_fim', new Date().toISOString());

    if (error) {
      console.error('Erro ao buscar assinaturas expiradas:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar assinaturas' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      assinaturas: assinaturasExpiradas,
      total: assinaturasExpiradas?.length || 0
    });

  } catch (error) {
    console.error('Erro na verificação de trial:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 