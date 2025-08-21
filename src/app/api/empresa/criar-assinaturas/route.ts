import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST() {
  try {
    console.log('Iniciando criação de assinaturas trial para empresas existentes...');
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Buscar todas as empresas
    const { data: todasEmpresas, error: errorEmpresas } = await supabaseAdmin
      .from('empresas')
      .select('id, nome, email, created_at');

    if (errorEmpresas) {
      console.error('Erro ao buscar empresas:', errorEmpresas);
      return NextResponse.json({ error: 'Erro ao buscar empresas' }, { status: 500 });
    }

    // 2. Buscar todas as assinaturas existentes
    const { data: todasAssinaturas, error: errorAssinaturas } = await supabaseAdmin
      .from('assinaturas')
      .select('empresa_id');

    if (errorAssinaturas) {
      console.error('Erro ao buscar assinaturas:', errorAssinaturas);
      return NextResponse.json({ error: 'Erro ao buscar assinaturas' }, { status: 500 });
    }

    // 3. Filtrar empresas que não têm assinatura
    const empresasComAssinatura = new Set(todasAssinaturas?.map(a => a.empresa_id) || []);
    const empresasSemAssinatura = todasEmpresas?.filter(empresa => !empresasComAssinatura.has(empresa.id)) || [];

    if (empresasSemAssinatura.length === 0) {
      return NextResponse.json({ 
        message: 'Todas as empresas já têm assinatura',
        empresas: []
      });
    }

    console.log(`Encontradas ${empresasSemAssinatura.length} empresas sem assinatura`);

    // 4. Obter o plano Trial
    const { data: plano, error: errorPlano } = await supabaseAdmin
      .from('planos')
      .select('id, nome')
      .eq('nome', 'Trial')
      .single();

    if (errorPlano || !plano) {
      console.error('Erro ao buscar plano Trial:', errorPlano);
      return NextResponse.json({ error: 'Plano Trial não encontrado' }, { status: 500 });
    }

    console.log('Plano Trial encontrado:', plano);

    // 5. Criar assinaturas trial
    const assinaturasParaCriar = empresasSemAssinatura.map(empresa => ({
      empresa_id: empresa.id,
      plano_id: plano.id,
      status: 'trial',
      data_inicio: new Date().toISOString(),
      data_trial_fim: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 dias
      valor: 0.00,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data: assinaturasCriadas, error: errorCriacao } = await supabaseAdmin
      .from('assinaturas')
      .insert(assinaturasParaCriar)
      .select('*');

    if (errorCriacao) {
      console.error('Erro ao criar assinaturas:', errorCriacao);
      return NextResponse.json({ error: 'Erro ao criar assinaturas' }, { status: 500 });
    }

    console.log(`Criadas ${assinaturasCriadas?.length || 0} assinaturas trial`);

    return NextResponse.json({
      success: true,
      message: `Criadas ${assinaturasCriadas?.length || 0} assinaturas trial`,
      empresas: empresasSemAssinatura,
      assinaturas: assinaturasCriadas
    });

  } catch (error) {
    console.error('Erro geral:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 