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
    
    console.log('🔴 FORCE LOGOUT API: Recebida requisição');
    console.log('🔴 Access Token:', access_token ? 'SIM' : 'NÃO');
    console.log('🔴 Refresh Token:', refresh_token ? 'SIM' : 'NÃO');
    console.log('🔴 User ID:', user_id);
    
    if (!access_token || !user_id) {
      console.log('❌ Dados insuficientes para logout');
      return NextResponse.json({ error: 'Token ou user_id não fornecido' }, { status: 400 });
    }

    console.log('🔴 FORCE LOGOUT API: Iniciando logout forçado no backend...');

    // 1. FORÇAR LOGOUT DE TODAS AS SESSÕES DO USUÁRIO
    console.log('🔴 Tentando forçar logout de todas as sessões...');
    const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(user_id);
    
    if (signOutError) {
      console.log('⚠️ Erro ao forçar logout de todas as sessões:', signOutError.message);
    } else {
      console.log('✅ Logout forçado de todas as sessões realizado');
    }

    // 2. INVALIDAR TODAS AS SESSÕES DO USUÁRIO
    console.log('🔴 Tentando invalidar todas as sessões...');
    try {
      const { error: invalidateError } = await supabaseAdmin.auth.admin.invalidateUserSessions(user_id);
      
      if (invalidateError) {
        console.log('⚠️ Erro ao invalidar sessões do usuário:', invalidateError.message);
      } else {
        console.log('✅ Sessões do usuário invalidadas com sucesso');
      }
    } catch (invalidateError) {
      console.log('⚠️ Erro ao invalidar sessões:', invalidateError);
    }

    // 3. ATUALIZAR METADATA DO USUÁRIO
    console.log('🔴 Tentando atualizar metadata...');
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
      console.log('⚠️ Erro ao atualizar metadata:', updateError.message);
    } else {
      console.log('✅ Metadata atualizada com sucesso');
    }

    console.log('✅ FORCE LOGOUT API: Logout forçado concluído');

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
