'use server'

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Payload recebido no backend:', body);
    const { nome, email, senha, cpf, nivel, empresa_id, whatsapp, usuario } = body;
    console.log('empresa_id recebido:', empresa_id);

    if (!empresa_id) {
      console.error('empresa_id não foi enviado');
      return NextResponse.json({ error: 'Empresa não identificada' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    // Verifica se já existe um usuário com esse e-mail
    const { data: existingUser } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      console.error('E-mail já cadastrado:', email);
      return NextResponse.json({ error: 'E-mail já cadastrado.' }, { status: 409 });
    }

    // Verifica se já existe um usuário com esse nome de usuário
    const { data: existingUsuario } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('usuario', usuario)
      .single();

    if (existingUsuario) {
      console.error('Usuário já cadastrado:', usuario);
      return NextResponse.json({ error: 'Usuário já cadastrado.' }, { status: 409 });
    }

    // Verifica se já existe um usuário com esse CPF
    const { data: existingCPF } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('cpf', cpf)
      .single();

    if (existingCPF) {
      console.error('CPF já cadastrado:', cpf);
      return NextResponse.json({ error: 'CPF já cadastrado.' }, { status: 409 });
    }

    if (!nome || !email || !senha || !cpf || !usuario) {
      console.error('Campos obrigatórios ausentes:', { nome, email, senha, cpf, usuario });
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    // Cria o usuário no Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    });

    console.log('authUser:', authUser);

    if (authError) {
      console.error('Erro ao criar usuário no Auth:', JSON.stringify(authError));
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authUser.user?.id) {
      console.error('ID do usuário não retornado:', authUser);
      return NextResponse.json({ error: 'Falha ao obter ID do usuário' }, { status: 400 });
    }

    console.log('Enviando dados para o banco:', {
      nome,
      email,
      usuario,
      auth_user_id: authUser.user?.id,
      cpf,
      tipo: 'principal',
      nivel,
      empresa_id,
      whatsapp,
    });

    const { error: dbError } = await supabaseAdmin.from('usuarios').insert([
      {
        nome,
        email,
        usuario,
        auth_user_id: authUser.user?.id,
        cpf,
        tipo: 'principal',
        nivel,
        empresa_id,
        whatsapp,
        // Adicionar tecnico_id igual ao auth_user_id para técnicos
        tecnico_id: nivel === 'tecnico' ? authUser.user?.id : null,
      },
    ]);

    if (dbError) {
      console.error('Erro ao salvar usuário no banco de dados:', dbError);
      return NextResponse.json(
        { error: dbError.message || JSON.stringify(dbError) || 'Erro ao salvar usuário no banco de dados' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Erro inesperado no try/catch:', error instanceof Error ? error.message : JSON.stringify(error));
    return NextResponse.json(
      { error: error instanceof Error ? error.message : JSON.stringify(error) || 'Erro desconhecido' },
      { status: 500 }
    );
  }
}