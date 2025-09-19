import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Verificar se há token de autorização
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Token não fornecido',
          timestamp: new Date().toISOString()
        }, 
        { status: 401 }
      );
    }

    // Verificar se o token JWT é válido
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (jwtError) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Token inválido',
          timestamp: new Date().toISOString()
        }, 
        { status: 401 }
      );
    }

    // Verificar conectividade com o banco de dados
    const { data, error } = await supabase
      .from('usuarios')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Erro na verificação do banco:', error);
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Erro de conectividade com banco de dados',
          timestamp: new Date().toISOString()
        }, 
        { status: 503 }
      );
    }

    // Verificar se o usuário ainda existe e está ativo
    if (decoded && typeof decoded === 'object' && 'userId' in decoded) {
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('id, nome, email, nivel')
        .eq('auth_user_id', decoded.userId)
        .maybeSingle();

      if (userError || !userData) {
        return NextResponse.json(
          { 
            status: 'error', 
            message: 'Usuário não encontrado ou inativo',
            timestamp: new Date().toISOString()
          }, 
          { status: 404 }
        );
      }

      // Tudo OK - retornar status de saúde
      return NextResponse.json({
        status: 'healthy',
        message: 'Sistema operacional',
        timestamp: new Date().toISOString(),
        user: {
          id: userData.id,
          nome: userData.nome,
          email: userData.email,
          nivel: userData.nivel
        },
        database: 'connected',
        auth: 'valid',
        uptime: process.uptime()
      });
    }

    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Token malformado',
        timestamp: new Date().toISOString()
      }, 
      { status: 400 }
    );

  } catch (error) {
    console.error('Erro no health check:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

export async function HEAD() {
  try {
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}

// Permitir OPTIONS para CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}