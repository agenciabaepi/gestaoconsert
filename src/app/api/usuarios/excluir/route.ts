import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(request: NextRequest) {
  try {
    // cookies() não é necessário aqui
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    );
    
    // Criar cliente admin para operações de Auth
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar dados do usuário atual
    const { data: usuarioAtual, error: userError } = await supabase
      .from('usuarios')
      .select('empresa_id, nivel')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !usuarioAtual) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Pegar o ID do usuário a ser excluído do body
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    // Verificar se não está tentando excluir a si mesmo
    if (id === user.id) {
      return NextResponse.json({ error: 'Você não pode excluir seu próprio usuário' }, { status: 400 });
    }

    // Buscar dados do usuário a ser excluído
    const { data: usuarioParaExcluir, error: fetchError } = await supabase
      .from('usuarios')
      .select('auth_user_id, empresa_id, nivel')
      .eq('id', id)
      .single();

    if (fetchError || !usuarioParaExcluir) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar se o usuário pertence à mesma empresa
    if (usuarioParaExcluir.empresa_id !== usuarioAtual.empresa_id) {
      return NextResponse.json({ error: 'Usuário não pertence à mesma empresa' }, { status: 403 });
    }

    // Verificar permissões (apenas admin pode excluir)
    if (usuarioAtual.nivel !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem excluir usuários' }, { status: 403 });
    }

    // Excluir o usuário da tabela usuarios
    const { error: deleteError } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: 'Erro ao excluir usuário' }, { status: 500 });
    }

    // Excluir o usuário do Supabase Auth
    if (usuarioParaExcluir.auth_user_id) {
      try {
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
          usuarioParaExcluir.auth_user_id
        );
        
        if (authError) {
          console.warn('Erro ao excluir usuário do Auth (pode ser por falta de service role key):', authError);
          // Não falha a operação se não conseguir excluir do Auth
        } else {
          console.log('Usuário excluído do Auth com sucesso:', usuarioParaExcluir.auth_user_id);
        }
      } catch (error) {
        console.warn('Erro ao tentar excluir do Auth (pode ser por falta de service role key):', error);
        // Não falha a operação se não conseguir excluir do Auth
      }
    }

    return NextResponse.json({ message: 'Usuário excluído com sucesso' });

  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
} 