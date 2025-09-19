import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('API Route - Iniciando atualização da OS:', id);
    
    // Parse JSON data from request body
    const updateData = await request.json();
    console.log('API Route - Dados recebidos:', updateData);
    
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set() {},
          remove() {},
        },
      }
    );
    
    // Tentar obter usuário diretamente
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log('API Route - Resultado getUser:', { user: !!user, error: userError });
    
    if (userError || !user) {
      console.error('API Route - Usuário não encontrado:', userError);
      return NextResponse.json({ error: 'Não autorizado - Usuário não encontrado. Faça login novamente.' }, { status: 401 });
    }

    console.log('API Route - Usuário autenticado:', user.id);

    // Buscar empresa_id do usuário
    const { data: userData, error: userDataError } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('auth_user_id', user.id)
      .single();

    if (userDataError || !userData?.empresa_id) {
      console.error('API Route - Erro ao buscar empresa do usuário:', userDataError);
      return NextResponse.json({ error: 'Empresa não encontrada para o usuário. Verifique se o usuário está vinculado a uma empresa.' }, { status: 403 });
    }

    const empresaId = userData.empresa_id;
    console.log('API Route - Empresa ID do usuário:', empresaId);

    // Prepare data for update
    const dataToUpdate: Record<string, unknown> = {};

    // Add data if not empty
    if (updateData.servico) dataToUpdate.servico = updateData.servico;
    if (updateData.peca) dataToUpdate.peca = updateData.peca;
    if (updateData.qtd_servico > 0) dataToUpdate.qtd_servico = updateData.qtd_servico;
    if (updateData.qtd_peca > 0) dataToUpdate.qtd_peca = updateData.qtd_peca;
    if (updateData.valor_servico > 0) dataToUpdate.valor_servico = updateData.valor_servico;
    if (updateData.valor_peca > 0) dataToUpdate.valor_peca = updateData.valor_peca;
    if (updateData.status_id) dataToUpdate.status_id = updateData.status_id;
    if (updateData.tecnico_id && updateData.tecnico_id !== '') dataToUpdate.tecnico_id = updateData.tecnico_id;
    if (updateData.termo_garantia_id) dataToUpdate.termo_garantia_id = updateData.termo_garantia_id;
    
    // Lógica automática para status técnico
    if (updateData.status) {
      const normalize = (s: string) => (s || '').toUpperCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
      dataToUpdate.status = updateData.status;
      const st = normalize(updateData.status);
      
      if (st === 'APROVADO') {
        dataToUpdate.status_tecnico = 'APROVADO';
      } else if (st === 'ENTREGUE') {
        dataToUpdate.status_tecnico = 'FINALIZADA';
        // Se não veio data_entrega explícita, registrar agora e calcular garantia
        if (!updateData.data_entrega) {
          const hoje = new Date();
          const dataStr = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())).toISOString().slice(0,10);
          const garantia = new Date(hoje);
          garantia.setDate(garantia.getDate() + 90);
          const garantiaStr = new Date(Date.UTC(garantia.getFullYear(), garantia.getMonth(), garantia.getDate())).toISOString().slice(0,10);
          dataToUpdate.data_entrega = dataStr; // colunas tipo date
          dataToUpdate.vencimento_garantia = garantiaStr;
        }
      } else if (st === 'AGUARDANDO APROVACAO') {
        dataToUpdate.status_tecnico = 'AGUARDANDO APROVAÇÃO';
      } else if (st === 'AGUARDANDO RETIRADA') {
        dataToUpdate.status_tecnico = 'AGUARDANDO RETIRADA';
      }
    }
    
    if (updateData.status_tecnico && !dataToUpdate.status_tecnico) {
      dataToUpdate.status_tecnico = updateData.status_tecnico;
    }

    // Calculate total value
    const valor_faturado = (updateData.qtd_servico * updateData.valor_servico) + (updateData.qtd_peca * updateData.valor_peca);
    dataToUpdate.valor_faturado = valor_faturado;

    console.log('API Route - Dados para atualização:', dataToUpdate);

    // Update the order
    const { data, error } = await supabase
      .from('ordens_servico')
      .update(dataToUpdate)
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .select();

    if (error) {
      console.error('API Route - Erro ao atualizar ordem:', error);
      return NextResponse.json({ error: 'Erro ao atualizar ordem: ' + error.message }, { status: 500 });
    }

    console.log('API Route - Ordem atualizada com sucesso:', data);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('API Route - Erro na API PUT /api/ordens/[id]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 