import nodemailer from 'nodemailer'

// Função para criar o transportador SMTP dinamicamente
function criarTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true' || true, // true para 465, false para outros
    auth: {
      user: process.env.SMTP_USER || 'suporte@gestaoconsert.com.br',
      pass: process.env.SMTP_PASS
    }
  })
}

// Gerar código de verificação de 6 dígitos
export function gerarCodigoVerificacao(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Enviar email de verificação
export async function enviarEmailVerificacao(
  email: string, 
  codigo: string, 
  nomeEmpresa: string
): Promise<boolean> {
  try {
    const transporter = criarTransporter()
    const info = await transporter.sendMail({
      from: '"Gestão Concert" <suporte@gestaoconsert.com.br>',
      to: email,
      subject: 'Confirme seu cadastro - Gestão Concert',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Confirmação de Cadastro</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin: 0;">Gestão Concert</h1>
              <p style="color: #666; margin: 10px 0 0 0;">Sistema de Gestão para Assistências Técnicas</p>
            </div>
            
            <h2 style="color: #333; margin-bottom: 20px;">Bem-vindo, ${nomeEmpresa}!</h2>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              Obrigado por se cadastrar na Gestão Concert! Para concluir seu cadastro e ter acesso ao sistema, 
              você precisa confirmar seu endereço de e-mail.
            </p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <p style="color: #333; margin-bottom: 10px; font-weight: bold;">Seu código de verificação é:</p>
              <div style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; margin: 10px 0;">
                ${codigo}
              </div>
              <p style="color: #666; font-size: 14px; margin-top: 10px;">
                Este código é válido por 24 horas
              </p>
            </div>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              Na próxima vez que fizer login, insira este código para ativar sua conta e começar a usar 
              todas as funcionalidades do sistema.
            </p>
            
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="color: #1976d2; margin: 0; font-size: 14px;">
                <strong>Dica:</strong> Salve este e-mail ou anote o código em um local seguro.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
              Este e-mail foi enviado automaticamente. Não responda a esta mensagem.<br>
              Se você não solicitou este cadastro, pode ignorar este e-mail.
            </p>
          </div>
        </body>
        </html>
      `
    })

    return true
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error)
    return false
  }
}

// Verificar se as configurações estão corretas
export async function verificarConfiguracao(): Promise<boolean> {
  try {
    const transporter = criarTransporter()
    await transporter.verify()
    return true
  } catch (error) {
    console.error('❌ Erro na configuração SMTP:', error)
    return false
  }
}
