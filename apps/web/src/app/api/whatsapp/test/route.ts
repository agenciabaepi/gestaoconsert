import { NextRequest, NextResponse } from 'next/server';

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
    if (!global.activeClients || !global.activeClients.has(empresa_id)) {
      return NextResponse.json({
        success: false,
        error: 'Cliente não encontrado',
        globalClientsInfo: {
          totalClients: global.activeClients ? global.activeClients.size : 0,
          clientKeys: global.activeClients ? Array.from(global.activeClients.keys()) : []
        }
      });
    }

    const client = global.activeClients.get(empresa_id);
    
    // Testes básicos do cliente
    const tests = {
      clientExists: !!client,
      clientType: typeof client,
      hasInfo: !!(client && client.info),
      hasWid: !!(client && client.info && client.info.wid),
      hasPupPage: !!(client && client.pupPage),
      pupPageClosed: client && client.pupPage ? client.pupPage.isClosed() : 'N/A',
      hasSendMessage: !!(client && typeof client.sendMessage === 'function'),
      hasIsRegisteredUser: !!(client && typeof client.isRegisteredUser === 'function')
    };

    // Tentar acessar propriedades básicas
    let basicProperties = {};
    try {
      if (client && client.info) {
        basicProperties = {
          wid: client.info.wid,
          pushname: client.info.pushname,
          platform: client.info.platform
        };
      }
    } catch (error) {
      basicProperties = { error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }

    return NextResponse.json({
      success: true,
      tests: tests,
      basicProperties: basicProperties,
      globalClientsInfo: {
        totalClients: global.activeClients.size,
        clientKeys: Array.from(global.activeClients.keys())
      }
    });

  } catch (error) {
    console.error('❌ WhatsApp: Erro no teste:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor: ' + (error instanceof Error ? error.message : 'Erro desconhecido') },
      { status: 500 }
    );
  }
}
