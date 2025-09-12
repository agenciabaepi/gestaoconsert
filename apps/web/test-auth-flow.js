const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://nxamrvfusyrtkcshehfm.supabase.co', 'sb_publishable_yeCVZiOGAsnR7D9jDDkdNw_r-aOcv31');

async function testAuthFlow() {
  console.log('🔐 TESTANDO FLUXO DE AUTENTICAÇÃO...');
  
  // Teste 1: Verificar sessão atual
  console.log('\n📋 1. Verificando sessão atual...');
  const { data: session, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.log('❌ Erro de sessão:', sessionError.message);
  } else if (session.session) {
    console.log('✅ Sessão encontrada:', session.session.user.email);
    
    // Teste 2: Buscar dados do usuário (como a aplicação faz)
    console.log('\n👤 2. Buscando dados do usuário...');
    const userId = session.session.user.id;
    
    // Tentar com auth_user_id
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_user_id', userId)
      .single();
    
    if (userError) {
      console.log('❌ Erro ao buscar usuário com auth_user_id:', userError.message);
      
      // Tentar com id
      const { data: userDataById, error: userErrorById } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userErrorById) {
        console.log('❌ Erro ao buscar usuário com id:', userErrorById.message);
      } else {
        console.log('✅ Usuário encontrado com id:', userDataById.nome);
      }
    } else {
      console.log('✅ Usuário encontrado com auth_user_id:', userData.nome);
    }
    
  } else {
    console.log('❌ Nenhuma sessão encontrada - usuário não está logado');
    
    // Teste 3: Verificar se há usuários na tabela
    console.log('\n📊 3. Verificando usuários na tabela...');
    const { data: allUsers, error: allUsersError } = await supabase
      .from('usuarios')
      .select('*')
      .limit(5);
    
    if (allUsersError) {
      console.log('❌ Erro ao buscar usuários:', allUsersError.message);
    } else {
      console.log(`✅ Usuários na tabela: ${allUsers?.length || 0}`);
      if (allUsers && allUsers.length > 0) {
        console.log('📋 Primeiro usuário:', JSON.stringify(allUsers[0], null, 2));
      }
    }
  }
}

testAuthFlow();
