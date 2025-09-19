import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { empresa_id } = await request.json();

    if (!empresa_id) {
      return NextResponse.json(
        { error: 'empresa_id é obrigatório' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Buscar assinatura ativa/trial
    const { data: assinatura, error: assinaturaError } = await supabaseAdmin
      .from('assinaturas')
      .select('*')
      .eq('empresa_id', empresa_id)
      .in('status', ['active', 'trial'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (assinaturaError) {
      console.log('Debug API: Erro ao buscar assinatura:', assinaturaError);
      return NextResponse.json(
        { error: 'Assinatura não encontrada' },
        { status: 404 }
      );
    }

    // Buscar plano da assinatura
    const { data: plano, error: planoError } = await supabaseAdmin
      .from('planos')
      .select('*')
      .eq('id', assinatura.plano_id)
      .single();

    if (planoError) {
      console.log('Debug API: Erro ao buscar plano:', planoError);
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      );
    }

    // Combinar assinatura com plano
    const assinaturaCompleta = {
      ...assinatura,
      plano
    };

    console.log('Debug API: Assinatura encontrada:', assinaturaCompleta);

    return NextResponse.json({
      success: true,
      data: assinaturaCompleta
    });

  } catch (error) {
    console.error('Erro na API route de busca de assinatura:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 