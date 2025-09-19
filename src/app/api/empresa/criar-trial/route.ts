import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { empresa_id } = await request.json();

    if (!empresa_id) {
      return NextResponse.json({ error: 'empresa_id é obrigatório' }, { status: 400 });
    }

    console.log('Iniciando criação de trial para empresa:', empresa_id);

    // Buscar plano Trial
    const { data: planoTrial, error: errorPlano } = await supabaseAdmin
      .from('planos')
      .select('*')
      .eq('nome', 'Trial')
      .single();

    if (errorPlano || !planoTrial) {
      console.error('Erro ao buscar plano Trial:', errorPlano);
      return NextResponse.json({ error: 'Plano Trial não encontrado' }, { status: 404 });
    }

    // Calcular data fim do trial (15 dias exatos)
    const dataInicio = new Date();
    const dataTrialFim = new Date(dataInicio.getTime() + (15 * 24 * 60 * 60 * 1000)); // 15 dias em milissegundos

    const payload = {
      empresa_id,
      plano_id: planoTrial.id,
      status: 'trial',
      data_inicio: dataInicio.toISOString(),
      data_fim: null, // Trial não tem data fim fixa
      data_trial_fim: dataTrialFim.toISOString(),
      valor: 0.00,
      gateway_pagamento: null,
      id_externo: null,
      observacoes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Payload para trial:', payload);

    const { data, error } = await supabaseAdmin
      .from('assinaturas')
      .insert(payload)
      .select();

    if (error) {
      console.error('Erro detalhado ao criar trial:', error);
      return NextResponse.json({ 
        error: 'Erro ao criar assinatura trial', 
        details: error 
      }, { status: 500 });
    }

    console.log('Trial criado com sucesso:', data);

    return NextResponse.json({
      success: true,
      message: 'Assinatura trial criada com sucesso!',
      assinatura: data?.[0]
    });

  } catch (error) {
    console.error('Erro geral:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 