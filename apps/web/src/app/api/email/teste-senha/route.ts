import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Criar transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true' || true,
      auth: {
        user: process.env.SMTP_USER || 'suporte@gestaoconsert.com.br',
        pass: process.env.SMTP_PASS
      }
    })

    // Testar verificação
    await transporter.verify()
    // Testar envio simples
    const info = await transporter.sendMail({
      from: '"Teste" <suporte@gestaoconsert.com.br>',
      to: email,
      subject: 'Teste de Configuração SMTP',
      text: 'Este é um teste de configuração SMTP.',
      html: '<p>Este é um teste de configuração SMTP.</p>'
    })

    return NextResponse.json({
      success: true,
      message: 'Teste de autenticação SMTP bem-sucedido',
      messageId: info.messageId
    })

  } catch (error) {
    console.error('❌ Erro no teste de autenticação SMTP:', error)
    return NextResponse.json({
      success: false,
      error: 'Falha na autenticação SMTP',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
