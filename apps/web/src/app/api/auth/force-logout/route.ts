import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase com service role key para forçar logout
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token, user_id } = await request.json();
    
    if (!access_token || !user_id) {
      return NextResponse.json({ error: 'Token ou user_id não fornecido' }, { status: 400 });
    }

    // 1. FORÇAR LOGOUT DE TODAS AS SESSÕES DO USUÁRIO
    const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(user_id);
    
    if (signOutError) {
      } else {
      }

    // 2. INVALIDAR TODAS AS SESSÕES DO USUÁRIO
    try {
      // Método não existe na API atual do Supabase, usando signOut como alternativa
      } catch (invalidateError) {
      }

    // 3. ATUALIZAR METADATA DO USUÁRIO
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      { 
        user_metadata: { 
          force_logout: Date.now(),
          last_logout: new Date().toISOString()
        } 
      }
    );

    if (updateError) {
      } else {
      }

    return NextResponse.json({ 
      success: true, 
      message: 'Sessão forçadamente encerrada',
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('❌ Erro no force logout API:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}
