import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { email, codigo } = await request.json()

    // Validar parâmetros obrigatórios
    if (!email || !codigo) {
      return NextResponse.json(
        { error: 'Email e código são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar código válido
    const { data: codigoVerificacao, error: codigoError } = await getSupabaseAdmin()
      .from('codigo_verificacao')
      .select(`
        id,
        usuario_id,
        codigo,
        usado,
        expira_em,
        usuarios (
          id,
          email,
          email_verificado
        )
      `)
      .eq('email', email)
      .eq('codigo', codigo)
      .eq('usado', false)
      .gte('expira_em', new Date().toISOString())
      .single()

    if (codigoError || !codigoVerificacao) {
      return NextResponse.json(
        { error: 'Código inválido ou expirado' },
        { status: 400 }
      )
    }

    // Marcar código como usado
    const { error: updateCodigoError } = await getSupabaseAdmin()
      .from('codigo_verificacao')
      .update({
        usado: true,
        usado_em: new Date().toISOString()
      })
      .eq('id', codigoVerificacao.id)

    if (updateCodigoError) {
      console.error('Erro ao marcar código como usado:', updateCodigoError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Marcar email como verificado
    const { error: updateUsuarioError } = await getSupabaseAdmin()
      .from('usuarios')
      .update({ email_verificado: true })
      .eq('id', codigoVerificacao.usuario_id)

    if (updateUsuarioError) {
      console.error('Erro ao marcar email como verificado:', updateUsuarioError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email verificado com sucesso',
      usuario: {
        id: codigoVerificacao.usuario_id,
        email_verificado: true
      }
    })

  } catch (error) {
    console.error('Erro na API de verificação de código:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
