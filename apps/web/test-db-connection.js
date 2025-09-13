const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testDatabaseConnection() {
  console.log('🔍 Testando conexão com o banco de dados...');
  
  // Verificar se as variáveis de ambiente estão carregadas
  console.log('\n📋 Variáveis de ambiente:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ Não encontrada');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Não encontrada');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ Não encontrada');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('❌ Variáveis de ambiente do Supabase não configuradas!');
    return;
  }
  
  try {
    // Teste com chave anônima
    console.log('\n🔗 Testando conexão com chave anônima...');
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const { data: healthCheck, error: healthError } = await supabaseAnon
      .from('empresas')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.log('❌ Erro na conexão anônima:', healthError.message);
    } else {
      console.log('✅ Conexão anônima funcionando!');
    }
    
    // Teste com service role key se disponível
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('\n🔑 Testando conexão com service role...');
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      const { data: adminData, error: adminError } = await supabaseAdmin
        .from('empresas')
        .select('id, nome')
        .limit(1);
      
      if (adminError) {
        console.log('❌ Erro na conexão admin:', adminError.message);
      } else {
        console.log('✅ Conexão admin funcionando!');
        console.log('📊 Dados de teste:', adminData);
      }
    }
    
    // Teste de tabelas específicas
    console.log('\n📋 Testando acesso às tabelas principais...');
    const tables = ['empresas', 'usuarios', 'ordens_servico', 'clientes'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAnon
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`❌ Tabela ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabela ${table}: Acessível`);
        }
      } catch (err) {
        console.log(`❌ Tabela ${table}: Erro de conexão`);
      }
    }
    
  } catch (error) {
    console.log('❌ Erro geral de conexão:', error.message);
  }
}

testDatabaseConnection().catch(console.error);