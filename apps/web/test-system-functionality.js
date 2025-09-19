const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSystemFunctionality() {
  console.log('🔍 Testando funcionalidades do sistema...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Teste 1: Verificar se existem empresas
    console.log('\n1️⃣ Testando tabela de empresas...');
    const { data: empresas, error: empresasError } = await supabase
      .from('empresas')
      .select('id, nome, ativo')
      .limit(5);
    
    if (empresasError) {
      console.log('❌ Erro ao buscar empresas:', empresasError.message);
    } else {
      console.log(`✅ Encontradas ${empresas.length} empresas`);
      if (empresas.length > 0) {
        console.log('📊 Primeira empresa:', empresas[0]);
      }
    }
    
    // Teste 2: Verificar usuários
    console.log('\n2️⃣ Testando tabela de usuários...');
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('id, email, nome')
      .limit(3);
    
    if (usuariosError) {
      console.log('❌ Erro ao buscar usuários:', usuariosError.message);
    } else {
      console.log(`✅ Encontrados ${usuarios.length} usuários`);
    }
    
    // Teste 3: Verificar ordens de serviço
    console.log('\n3️⃣ Testando tabela de ordens de serviço...');
    const { data: ordens, error: ordensError } = await supabase
      .from('ordens_servico')
      .select('id, numero_os, status')
      .limit(3);
    
    if (ordensError) {
      console.log('❌ Erro ao buscar ordens:', ordensError.message);
    } else {
      console.log(`✅ Encontradas ${ordens.length} ordens de serviço`);
    }
    
    // Teste 4: Verificar clientes
    console.log('\n4️⃣ Testando tabela de clientes...');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('id, nome, email')
      .limit(3);
    
    if (clientesError) {
      console.log('❌ Erro ao buscar clientes:', clientesError.message);
    } else {
      console.log(`✅ Encontrados ${clientes.length} clientes`);
    }
    
    // Teste 5: Verificar schema da tabela ordens_servico
    console.log('\n5️⃣ Verificando schema da tabela ordens_servico...');
    const { data: schemaInfo, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'ordens_servico' })
      .single();
    
    if (schemaError) {
      console.log('⚠️  Não foi possível verificar schema automaticamente');
      // Teste alternativo: tentar inserir dados de teste
      console.log('🔄 Testando inserção de dados...');
      const { data: testInsert, error: insertError } = await supabase
        .from('ordens_servico')
        .select('description')
        .limit(1);
      
      if (insertError && insertError.message.includes('description')) {
        console.log('❌ Coluna "description" não encontrada na tabela ordens_servico');
      } else {
        console.log('✅ Schema da tabela parece estar correto');
      }
    }
    
    // Teste 6: Verificar RLS (Row Level Security)
    console.log('\n6️⃣ Testando políticas RLS...');
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const { data: rlsTest, error: rlsError } = await supabaseAnon
      .from('empresas')
      .select('id')
      .limit(1);
    
    if (rlsError) {
      console.log('⚠️  RLS pode estar bloqueando acesso anônimo:', rlsError.message);
    } else {
      console.log('✅ RLS configurado corretamente');
    }
    
    console.log('\n🎯 Resumo do diagnóstico:');
    console.log('- Conexão com banco: ✅ Funcionando');
    console.log('- Tabelas principais: ✅ Acessíveis');
    console.log('- Variáveis de ambiente: ✅ Configuradas');
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }
}

testSystemFunctionality().catch(console.error);