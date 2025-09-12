import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabaseAdmin = getSupabaseAdmin();
    const { id, nome, email, usuario, telefone, cpf, whatsapp, nivel, permissoes, senha, auth_user_id } = body;
    if (!id) {
      return NextResponse.json({ error: 'ID do usuário não informado' }, { status: 400 });
    }

    // Atualiza e-mail no Supabase Auth se fornecido
    if (email && auth_user_id) {
      const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(auth_user_id, { email: email });
      if (emailError) {
        console.error('Erro ao atualizar e-mail no Auth:', emailError);
        return NextResponse.json({ error: 'Erro ao atualizar e-mail: ' + emailError.message }, { status: 400 });
      }
      }

    // Atualiza senha no Supabase Auth se fornecida
    if (senha && auth_user_id) {
      const { error: senhaError } = await supabaseAdmin.auth.admin.updateUserById(auth_user_id, { password: senha });
      if (senhaError) {
        return NextResponse.json({ error: 'Erro ao atualizar senha: ' + senhaError.message }, { status: 400 });
      }
    }

    // Atualiza dados na tabela usuarios
    const { error: dbError } = await supabaseAdmin.from('usuarios').update({
      nome,
      email,
      usuario,
      telefone,
      cpf,
      whatsapp,
      nivel,
      permissoes,
      // Atualizar tecnico_id quando o nível for alterado para técnico
      tecnico_id: nivel === 'tecnico' ? auth_user_id : null,
    }).eq('id', id);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 });
  }
} 