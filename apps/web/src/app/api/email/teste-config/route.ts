import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const config = {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_SECURE: process.env.SMTP_SECURE,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS ? '***CONFIGURADO***' : '***NÃO CONFIGURADO***',
      NODE_ENV: process.env.NODE_ENV
    }

    return NextResponse.json({
      success: true,
      config: config,
      message: 'Configurações verificadas'
    })

  } catch (error) {
    console.error('❌ Erro ao verificar configurações:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
