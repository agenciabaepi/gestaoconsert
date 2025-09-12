import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { enviarEmailVerificacao, gerarCodigoVerificacao } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { usuarioId, email, nomeEmpresa } = await request.json()

    // Validar parâmetros obrigatórios
    if (!usuarioId || !email || !nomeEmpresa) {
      return NextResponse.json(
        { error: 'usuarioId, email e nomeEmpresa são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const { data: usuario, error: usuarioError } = await getSupabaseAdmin()
      .from('usuarios')
      .select('id, email')
      .eq('id', usuarioId)
      .single()

    if (usuarioError || !usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Gerar código de verificação
    const codigo = gerarCodigoVerificacao()

    // Invalidar códigos anteriores do usuário
    await getSupabaseAdmin()
      .from('codigo_verificacao')
      .update({ usado: true })
      .eq('usuario_id', usuarioId)
      .eq('usado', false)

    // Salvar novo código no banco
    const { error: codigoError } = await getSupabaseAdmin()
      .from('codigo_verificacao')
      .insert({
        usuario_id: usuarioId,
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
      message: 'Código de verificação enviado com sucesso'
    })

  } catch (error) {
    console.error('Erro na API de envio de código:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
