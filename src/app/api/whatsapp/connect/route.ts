import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { Client, LocalAuth } from 'whatsapp-web.js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Inicializar o mapa global de clientes ativos se não existir
if (!global.activeClients) {
  global.activeClients = new Map();
}

export async function POST(request: NextRequest) {
  try {
    const { empresa_id } = await request.json();

    if (!empresa_id) {
      return NextResponse.json(
        { error: 'Empresa ID é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔔 WhatsApp: Iniciando conexão REAL para empresa:', empresa_id);
    console.log('🔔 WhatsApp: Estado atual de global.activeClients:', {
      size: global.activeClients.size,
      keys: Array.from(global.activeClients.keys())
    });

    // Se já existe um cliente ativo, desconectar
    if (global.activeClients.has(empresa_id)) {
      const existingClient = global.activeClients.get(empresa_id);
      if (existingClient) {
        console.log('🔔 WhatsApp: Destruindo cliente existente para empresa:', empresa_id);
        await existingClient.destroy();
        global.activeClients.delete(empresa_id);
        console.log('✅ WhatsApp: Cliente existente removido de global.activeClients');
        
        // Limpar sessão local do disco
        try {
          const sessionPath = path.join(process.cwd(), 'whatsapp-sessions', empresa_id);
          if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
            console.log('✅ WhatsApp: Sessão local removida do disco:', sessionPath);
          }
        } catch (error) {
          console.error('❌ WhatsApp: Erro ao remover sessão local:', error);
        }
      }
    }

    // Primeiro, criar/atualizar a sessão no banco com valores padrão
    const { error: upsertError } = await supabase
      .from('whatsapp_sessions')
      .upsert({
        empresa_id,
        status: 'connecting',
        qr_code: null,
        numero_whatsapp: '', // Valor padrão vazio
        nome_contato: '', // Valor padrão vazio
        session_data: null,
        ultima_conexao: null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'empresa_id' });

    if (upsertError) {
      console.error('❌ WhatsApp: Erro ao criar sessão:', upsertError);
      return NextResponse.json(
        { error: 'Erro ao criar sessão' },
        { status: 500 }
      );
    }

    console.log('✅ WhatsApp: Sessão criada/atualizada no banco');

    // Criar novo cliente WhatsApp Web com configurações otimizadas
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: empresa_id,
        dataPath: `./whatsapp-sessions/${empresa_id}`
      }),
      puppeteer: {
        headless: true, // Modo invisível para funcionar em background
        timeout: 120000, // 120 segundos máximo
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-field-trial-config',
          '--disable-ipc-flooding-protection',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=site-per-process',
          '--single-process',
          '--disable-gpu-sandbox',
          '--disable-notifications',
          '--disable-default-apps',
          '--disable-sync',
          '--disable-translate',
          '--hide-scrollbars',
          '--mute-audio',
          '--no-default-browser-check',
          '--disable-component-extensions-with-policy',
          '--disable-background-networking',
          '--disable-client-side-phishing-detection',
          '--disable-domain-reliability',
          '--disable-features=TranslateUI',
          '--no-pings',
          '--password-store=basic',
          '--use-mock-keychain'
        ]
      }
    });

    let qrCodeData = '';
    let connectionStatus = 'connecting';
    let qrCodeGenerated = false;

    // Evento: QR Code gerado
    client.on('qr', async (qr) => {
      console.log('🔔 WhatsApp: QR Code REAL gerado para empresa:', empresa_id);
      console.log('🔔 WhatsApp: Dados do QR Code:', qr.substring(0, 50) + '...');
      
      try {
        // Gerar QR Code como imagem base64
        qrCodeData = await QRCode.toDataURL(qr);
        console.log('🔔 WhatsApp: QR Code convertido para base64, tamanho:', qrCodeData.length);
        
        // Atualizar banco com QR Code
        const { error: updateError } = await supabase
          .from('whatsapp_sessions')
          .update({
            qr_code: qrCodeData,
            status: 'connecting',
            updated_at: new Date().toISOString()
          })
          .eq('empresa_id', empresa_id);

        if (updateError) {
          console.error('❌ WhatsApp: Erro ao salvar QR Code no banco:', updateError);
        } else {
          console.log('✅ WhatsApp: QR Code salvo no banco com sucesso');
          qrCodeGenerated = true;
        }

        connectionStatus = 'connecting';
      } catch (error) {
        console.error('❌ WhatsApp: Erro ao gerar QR Code:', error);
      }
    });

    // Evento: Cliente pronto
    client.on('ready', async () => {
      console.log('✅ WhatsApp: Cliente REAL conectado para empresa:', empresa_id);
      
      try {
        // Atualizar banco com status conectado
        await supabase
          .from('whatsapp_sessions')
          .update({
            numero_whatsapp: client.info.wid.user,
            nome_contato: client.info.pushname,
            status: 'connected',
            qr_code: null,
            ultima_conexao: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('empresa_id', empresa_id);

        connectionStatus = 'connected';
        global.activeClients.set(empresa_id, client);
        console.log('✅ WhatsApp: Status atualizado para conectado');
        console.log('✅ WhatsApp: Cliente salvo em global.activeClients para empresa:', empresa_id);
        console.log('✅ WhatsApp: Total de clientes ativos:', global.activeClients.size);
      } catch (error) {
        console.error('❌ WhatsApp: Erro ao atualizar status:', error);
      }
    });

    // Evento: Desconectado
    client.on('disconnected', async (reason) => {
      console.log('❌ WhatsApp: Cliente desconectado para empresa:', empresa_id, 'Razão:', reason);
      
      try {
        await supabase
          .from('whatsapp_sessions')
          .update({
            status: 'disconnected',
            qr_code: null,
            updated_at: new Date().toISOString()
          })
          .eq('empresa_id', empresa_id);

        connectionStatus = 'disconnected';
        global.activeClients.delete(empresa_id);
        console.log('✅ WhatsApp: Cliente removido de global.activeClients para empresa:', empresa_id);
      } catch (error) {
        console.error('❌ WhatsApp: Erro ao atualizar status desconectado:', error);
      }
    });

    // Evento: Erro de autenticação
    client.on('auth_failure', async (msg) => {
      console.error('❌ WhatsApp: Falha na autenticação para empresa:', empresa_id, msg);
      
      try {
        await supabase
          .from('whatsapp_sessions')
          .update({
            status: 'error',
            qr_code: null,
            updated_at: new Date().toISOString()
          })
          .eq('empresa_id', empresa_id);

        connectionStatus = 'error';
        global.activeClients.delete(empresa_id);
        console.log('✅ WhatsApp: Cliente removido de global.activeClients devido a erro de auth');
      } catch (error) {
        console.error('❌ WhatsApp: Erro ao atualizar status de erro:', error);
      }
    });

    // Inicializar cliente com timeout
    console.log('🔔 WhatsApp: Inicializando cliente...');
    
    // Promise com timeout para evitar travamento
    const initPromise = client.initialize();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout na inicialização')), 60000); // 60 segundos
    });

    try {
      await Promise.race([initPromise, timeoutPromise]);
      console.log('🔔 WhatsApp: Cliente inicializado');
    } catch (error) {
      console.error('❌ WhatsApp: Timeout na inicialização:', error);
      
      // Se timeout, retornar erro mas manter QR Code se foi gerado
      if (qrCodeGenerated) {
        console.log('⚠️ WhatsApp: Timeout mas QR Code foi gerado, retornando dados');
        return NextResponse.json({
          success: true,
          status: 'connecting',
          qr_code: qrCodeData,
          message: 'QR Code gerado com sucesso! Escaneie para conectar.'
        });
      }
      
      return NextResponse.json(
        { error: 'Timeout na conexão. Tente novamente.' },
        { status: 408 }
      );
    }

    // Aguardar QR Code ser gerado (máximo 15 segundos)
    console.log('🔔 WhatsApp: Aguardando QR Code...');
    let attempts = 0;
    const maxAttempts = 30; // 30 tentativas de 500ms = 15 segundos

    while (!qrCodeGenerated && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
      console.log(`🔔 WhatsApp: Aguardando QR Code... tentativa ${attempts}/${maxAttempts}`);
    }

    if (!qrCodeGenerated) {
      console.log('⚠️ WhatsApp: QR Code não foi gerado em tempo hábil');
    }

    // Buscar dados atualizados
    const { data: sessionData, error: sessionError } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('empresa_id', empresa_id)
      .single();

    if (sessionError) {
      console.error('❌ WhatsApp: Erro ao buscar sessão:', sessionError);
      // Se erro ao buscar, retornar dados do QR Code se foi gerado
      if (qrCodeGenerated) {
        return NextResponse.json({
          success: true,
          status: 'connecting',
          qr_code: qrCodeData,
          message: 'QR Code gerado com sucesso! Escaneie para conectar.'
        });
      }
    } else {
      console.log('🔔 WhatsApp: Dados da sessão:', {
        status: sessionData?.status,
        qr_code: sessionData?.qr_code ? 'PRESENTE' : 'AUSENTE',
        empresa_id: sessionData?.empresa_id
      });
    }

    console.log('🔔 WhatsApp: Estado FINAL de global.activeClients:', {
      size: global.activeClients.size,
      keys: Array.from(global.activeClients.keys()),
      connectionStatus: connectionStatus
    });

    return NextResponse.json({
      success: true,
      status: connectionStatus,
      qr_code: sessionData?.qr_code || qrCodeData,
      session: sessionData
    });

  } catch (error) {
    console.error('❌ WhatsApp: Erro ao conectar:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET para verificar status da conexão
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empresa_id = searchParams.get('empresa_id');

    if (!empresa_id) {
      return NextResponse.json(
        { error: 'Empresa ID é obrigatório' },
        { status: 400 }
      );
    }

    const { data: session } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('empresa_id', empresa_id)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: 'Sessão não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session
    });

  } catch (error) {
    console.error('❌ WhatsApp: Erro ao buscar status:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE para desconectar WhatsApp
export async function DELETE(request: NextRequest) {
  try {
    const { empresa_id } = await request.json();

    if (!empresa_id) {
      return NextResponse.json(
        { error: 'Empresa ID é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔔 WhatsApp: Desconectando cliente para empresa:', empresa_id);

    // Verificar se há cliente ativo
    if (global.activeClients && global.activeClients.has(empresa_id)) {
      const client = global.activeClients.get(empresa_id);
      
      if (client) {
        try {
          console.log('🔔 WhatsApp: Destruindo cliente existente...');
          await client.destroy();
          console.log('✅ WhatsApp: Cliente destruído com sucesso');
        } catch (error) {
          console.error('❌ WhatsApp: Erro ao destruir cliente:', error);
        }
        
        global.activeClients.delete(empresa_id);
        console.log('✅ WhatsApp: Cliente removido de global.activeClients');
        
        // Limpar sessão local do disco
        try {
          const sessionPath = path.join(process.cwd(), 'whatsapp-sessions', empresa_id);
          if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
            console.log('✅ WhatsApp: Sessão local removida do disco:', sessionPath);
          }
        } catch (error) {
          console.error('❌ WhatsApp: Erro ao remover sessão local:', error);
        }
      }
    }

    // Atualizar status no banco para 'disconnected'
    const { error: updateError } = await supabase
      .from('whatsapp_sessions')
      .update({
        status: 'disconnected',
        qr_code: null,
        numero_whatsapp: '',
        nome_contato: '',
        updated_at: new Date().toISOString()
      })
      .eq('empresa_id', empresa_id);

    if (updateError) {
      console.error('❌ WhatsApp: Erro ao atualizar status no banco:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar status no banco' },
        { status: 500 }
      );
    }

    console.log('✅ WhatsApp: Status atualizado para disconnected no banco');

    return NextResponse.json({
      success: true,
      message: 'WhatsApp desconectado com sucesso'
    });

  } catch (error) {
    console.error('❌ WhatsApp: Erro ao desconectar:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
