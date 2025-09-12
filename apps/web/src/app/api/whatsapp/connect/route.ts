import { NextRequest, NextResponse } from 'next/server';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Declaração global para clientes ativos
declare global {
  var activeClients: Map<string, Client>;
}

if (!global.activeClients) {
  global.activeClients = new Map();
}

// Método GET para verificar status da conexão
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

    // Verificar se há cliente ativo
    const hasActiveClient = global.activeClients.has(empresa_id);
    
    // Buscar status da sessão no banco
    const { data, error } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('empresa_id', empresa_id)
      .single();

    if (error) {
      console.error('❌ WhatsApp: Erro ao buscar sessão:', error);
      return NextResponse.json({
        status: 'disconnected',
        message: 'Erro ao buscar sessão',
        hasActiveClient: false
      });
    }

    if (!data) {
      return NextResponse.json({
        status: 'disconnected',
        message: 'Nenhuma sessão encontrada',
        hasActiveClient: false
      });
    }

    return NextResponse.json({
      status: data.status,
      qr_code: data.qr_code,
      numero_whatsapp: data.numero_whatsapp,
      nome_contato: data.nome_contato,
      hasActiveClient,
      updated_at: data.updated_at
    });

  } catch (error) {
    console.error('❌ WhatsApp: Erro ao verificar status da conexão:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Método POST para conectar WhatsApp
export async function POST(request: NextRequest) {
  try {
    const { empresa_id } = await request.json();

    if (!empresa_id) {
      return NextResponse.json(
        { error: 'Empresa ID é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se já existe um cliente ativo
    if (global.activeClients.has(empresa_id)) {
      return NextResponse.json(
        { error: 'Cliente já está conectado' },
        { status: 400 }
      );
    }

    // Criar/atualizar sessão no banco
    const { error: upsertError } = await supabase
      .from('whatsapp_sessions')
      .upsert({
        empresa_id,
        status: 'connecting',
        qr_code: null,
        numero_whatsapp: '',
        nome_contato: '',
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      console.error('❌ WhatsApp: Erro ao criar/atualizar sessão no banco:', upsertError);
      return NextResponse.json(
        { error: 'Erro ao criar sessão no banco' },
        { status: 500 }
      );
    }

    // Configurar diretório de sessão
    const sessionPath = path.join(process.cwd(), 'whatsapp-sessions', empresa_id);
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    // Criar cliente WhatsApp com Puppeteer integrado
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: empresa_id,
        dataPath: sessionPath
      }),
      puppeteer: {
        headless: true,
        executablePath: '/usr/bin/chromium-browser',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-webgl',
          '--disable-3d-apis',
          '--disable-accelerated-2d-canvas',
          '--disable-features=VizDisplayCompositor',
          '--disable-dbus',
          '--single-process',
          '--no-zygote',
          '--disable-extensions'
        ]
      }
    });

    // Eventos do cliente
    client.on('qr', async (qr) => {
      // Atualizar QR Code no banco
      const { error: updateError } = await supabase
        .from('whatsapp_sessions')
        .update({
          qr_code: qr,
          status: 'qr_ready',
          updated_at: new Date().toISOString()
        })
        .eq('empresa_id', empresa_id);

      if (updateError) {
        console.error('❌ WhatsApp: Erro ao atualizar QR Code no banco:', updateError);
      } else {
        }
    });

    client.on('ready', async () => {
      // Atualizar status no banco
      const { error: updateError } = await supabase
        .from('whatsapp_sessions')
        .update({
          status: 'connected',
          qr_code: null,
          updated_at: new Date().toISOString()
        })
        .eq('empresa_id', empresa_id);

      if (updateError) {
        console.error('❌ WhatsApp: Erro ao atualizar status no banco:', updateError);
      } else {
        }
    });

    client.on('authenticated', () => {
      });

    client.on('auth_failure', (msg) => {
      console.error('❌ WhatsApp: Falha na autenticação:', msg);
    });

    client.on('disconnected', async (reason) => {
      // Remover cliente da lista global
      global.activeClients.delete(empresa_id);
      
      // Atualizar status no banco
      const { error: updateError } = await supabase
        .from('whatsapp_sessions')
        .update({
          status: 'disconnected',
          qr_code: null,
          updated_at: new Date().toISOString()
        })
        .eq('empresa_id', empresa_id);

      if (updateError) {
        console.error('❌ WhatsApp: Erro ao atualizar status no banco:', updateError);
      }
    });

    // Inicializar cliente
    await client.initialize();

    // Adicionar cliente à lista global
    global.activeClients.set(empresa_id, client);

    return NextResponse.json({
      success: true,
      message: 'WhatsApp conectado com sucesso!',
      status: 'connecting'
    });

  } catch (error) {
    console.error('❌ WhatsApp: Erro ao conectar:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor: ' + (error instanceof Error ? error.message : 'Erro desconhecido') },
      { status: 500 }
    );
  }
}