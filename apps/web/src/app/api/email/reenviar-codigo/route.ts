import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { enviarEmailVerificacao, gerarCodigoVerificacao } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    // Validar parâmetros obrigatórios
    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar usuário pelo email
    const { data: usuario, error: usuarioError } = await getSupabaseAdmin()
      .from('usuarios')
      .select(`
        id,
        nome,
        email,
        email_verificado,
        empresa_id
      `)
      .eq('email', email)
      .eq('email_verificado', false)
      .single()

    if (usuarioError || !usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado ou email já verificado' },
        { status: 404 }
      )
    }

    // Gerar novo código de verificação
    const codigo = gerarCodigoVerificacao()

    // Invalidar códigos anteriores do usuário
    await getSupabaseAdmin()
      .from('codigo_verificacao')
      .update({ usado: true })
      .eq('usuario_id', usuario.id)
      .eq('usado', false)

    // Salvar novo código no banco
    const { error: codigoError } = await getSupabaseAdmin()
      .from('codigo_verificacao')
      .insert({
        usuario_id: usuario.id,
        codigo: codigo,
        email: email,
        usado: false,
        expira_em: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
      })

    if (codigoError) {
      console.error('Erro ao salvar código:', codigoError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Buscar nome da empresa se tiver empresa_id
    let nomeEmpresa = 'Empresa'
    if (usuario.empresa_id) {
      const { data: empresa } = await getSupabaseAdmin()
        .from('empresas')
        .select('nome')
        .eq('id', usuario.empresa_id)
        .single()
      
      if (empresa?.nome) {
        nomeEmpresa = empresa.nome
      }
    }
    
    // Enviar email
    const emailEnviado = await enviarEmailVerificacao(email, codigo, nomeEmpresa)

    if (!emailEnviado) {
      return NextResponse.json(
        { error: 'Erro ao enviar email de verificação' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Novo código de verificação enviado com sucesso'
    })

  } catch (error) {
    console.error('Erro na API de reenvio de código:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
