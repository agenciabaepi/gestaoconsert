const { createClient } = require('@supabase/supabase-js');

// Cliente anônimo (como usuário não logado)
const supabaseAnon = createClient('https://nxamrvfusyrtkcshehfm.supabase.co', 'sb_publishable_yeCVZiOGAsnR7D9jDDkdNw_r-aOcv31');

// Cliente admin (service role - bypass RLS)
const supabaseAdmin = createClient('https://nxamrvfusyrtkcshehfm.supabase.co', 'sb_secret_3dbdcMGcAy0QzCOOQh4TWg_deFhjsXQ');

async function testRLS() {
  console.log('🔒 TESTANDO RLS (Row Level Security)...');
  
  // Teste 1: Query sem autenticação (como usuário anônimo)
  console.log('\n👤 Testando como usuário anônimo...');
  const { data: ordensAnon, error: ordensAnonError } = await supabaseAnon
    .from('ordens_servico')
    .select('*')
    .limit(1);
  
  if (ordensAnonError) {
    console.log('❌ Erro como anônimo:', ordensAnonError.message);
  } else {
    console.log(`✅ Como anônimo: ${ordensAnon?.length || 0} registros`);
  }
  
  // Teste 2: Query com service role (bypass RLS)
  console.log('\n🔑 Testando com service role...');
  const { data: ordensAdmin, error: ordensAdminError } = await supabaseAdmin
    .from('ordens_servico')
    .select('*')
    .limit(1);
  
  if (ordensAdminError) {
    console.log('❌ Erro como admin:', ordensAdminError.message);
  } else {
    console.log(`✅ Como admin: ${ordensAdmin?.length || 0} registros`);
  }
  
  // Teste 3: Verificar se RLS está ativo
  console.log('\n📋 Verificando status do RLS...');
  const { data: rlsStatus, error: rlsError } = await supabaseAdmin
    .rpc('check_rls_status', { table_name: 'ordens_servico' })
    .catch(async () => {
      // Fallback: tentar query direta
      const { data, error } = await supabaseAdmin
        .from('information_schema.tables')
        .select('*')
        .eq('table_name', 'ordens_servico');
      return { data, error };
    });
  
  if (rlsError) {
    console.log('❌ Erro ao verificar RLS:', rlsError.message);
  } else {
    console.log('✅ Status RLS verificado');
  }
  
  // Teste 4: Comparar resultados
  console.log('\n📊 COMPARAÇÃO:');
  console.log(`Anônimo: ${ordensAnon?.length || 0} registros`);
  console.log(`Admin: ${ordensAdmin?.length || 0} registros`);
  
  if ((ordensAnon?.length || 0) === 0 && (ordensAdmin?.length || 0) > 0) {
    console.log('🚨 RLS ESTÁ BLOQUEANDO ACESSO ANÔNIMO!');
  } else if ((ordensAnon?.length || 0) === (ordensAdmin?.length || 0)) {
    console.log('✅ RLS não está bloqueando ou não está ativo');
  }
}

testRLS();
