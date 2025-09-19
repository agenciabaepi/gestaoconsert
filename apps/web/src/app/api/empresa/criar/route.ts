import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const body = await request.json();
  const supabaseAdmin = getSupabaseAdmin();
  const {
    nome,
    email,
    senha,
    nomeEmpresa,
    cidade,
    cnpj: cnpjOriginal,
    cpf: cpfOriginal,
    endereco,
    whatsapp,
    website,
    plano
  } = body;

  // Normalizar cpf e cnpj
  const cpf = cpfOriginal?.replace(/\D/g, '') || null;
  const cnpj = cnpjOriginal?.replace(/\D/g, '') || null;

  // Verificar se o email já existe
  const { data: emailExistente } = await supabaseAdmin
    .from('empresas')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (emailExistente) {
    return NextResponse.json({ error: 'E-mail já cadastrado.' }, { status: 400 });
  }

  // Verificar se o CPF já existe
  if (cpf) {
    const { data: cpfExistente } = await supabaseAdmin
      .from('empresas')
      .select('id')
      .eq('cpf', cpf)
      .maybeSingle();

    if (cpfExistente) {
      return NextResponse.json({ error: 'CPF já cadastrado.' }, { status: 400 });
    }
  }

  // Verificar se o CNPJ já existe
  if (cnpj) {
    const { data: cnpjExistente } = await supabaseAdmin
      .from('empresas')
      .select('id')
      .eq('cnpj', cnpj)
      .maybeSingle();

    if (cnpjExistente) {
      return NextResponse.json({ error: 'CNPJ já cadastrado.' }, { status: 400 });
    }
  }

  // Criar usuário no Supabase Auth
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });

  if (authError) {
    console.error('Erro ao criar usuário no Auth:', authError);
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  if (!authUser.user?.id) {
    console.error('ID do usuário não retornado:', authUser);
    return NextResponse.json({ error: 'Falha ao obter ID do usuário' }, { status: 400 });
  }

  const user_id = authUser.user.id;

  // 2. Criar empresa
  const { data: empresa, error: empresaError } = await supabaseAdmin
    .from('empresas')
    .insert({
      nome: nomeEmpresa,
      cidade,
      cnpj,
      cpf,
      endereco,
      telefone: whatsapp,
      email,
      website,
      plano,
      maxusuarios: plano === 'basico' ? 2 : plano === 'pro' ? 5 : 10,
      user_id
    })
    .select()
    .single();

  if (empresaError || !empresa) {
    console.error('Erro ao criar empresa:', empresaError);
    return NextResponse.json({ error: 'Erro ao criar empresa', details: empresaError }, { status: 500 });
  }
  // 3. Cadastrar usuário na tabela 'usuarios'
  const { data: usuario, error: usuarioError } = await supabaseAdmin
    .from('usuarios')
    .insert({
      id: user_id,
      auth_user_id: user_id,
      nome,
      email,
      usuario: email.split('@')[0], // Usar parte do email como usuário
      empresa_id: empresa.id,
      nivel: 'admin',
      email_verificado: false // Email ainda não verificado
    })
    .select()
    .single();

  if (usuarioError || !usuario) {
    console.error('Erro ao salvar usuário:', usuarioError);
    return NextResponse.json({ error: 'Erro ao salvar usuário', details: usuarioError }, { status: 500 });
  }
  // 4. Criar assinatura trial
  try {
          // Buscar plano trial
      const { data: planoTrial } = await supabaseAdmin
        .from('planos')
        .select('*')
        .eq('nome', 'Trial')
        .single();

      if (planoTrial) {
        // Calcular data fim do trial (15 dias exatos)
        const dataInicio = new Date();
        const dataTrialFim = new Date(dataInicio.getTime() + (15 * 24 * 60 * 60 * 1000)); // 15 dias em milissegundos

        const { error: assinaturaError } = await supabaseAdmin
          .from('assinaturas')
          .insert({
            empresa_id: empresa.id,
            plano_id: planoTrial.id,
            status: 'trial',
            data_inicio: dataInicio.toISOString(),
            data_trial_fim: dataTrialFim.toISOString(),
            valor: 0
          });

      if (assinaturaError) {
        console.error('Erro ao criar assinatura trial:', assinaturaError);
        // Não falhar a criação da empresa por causa da assinatura
      } else {
        }
    }
  } catch (error) {
    console.error('Erro ao criar assinatura trial:', error);
    // Não falhar a criação da empresa por causa da assinatura
  }

  // 5. Enviar código de verificação por email
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/enviar-codigo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        usuarioId: usuario.id,
        email: email,
        nomeEmpresa: nomeEmpresa
      })
    });

    if (!response.ok) {
      console.error('Erro ao enviar código de verificação:', await response.text());
      // Não falhar o cadastro por causa do email
    } else {
      }
  } catch (error) {
    console.error('Erro ao enviar código de verificação:', error);
    // Não falhar o cadastro por causa do email
  }

  return NextResponse.json({ 
    sucesso: true, 
    empresa_id: empresa.id,
    usuario_id: usuario.id,
    email_enviado: true,
    message: 'Cadastro realizado com sucesso! Verifique seu email para ativar sua conta.' 
  });
}