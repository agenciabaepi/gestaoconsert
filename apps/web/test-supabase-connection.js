// Teste simples de conexão com Supabase
const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase (mesmas do projeto)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testando conexão Supabase...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'Presente' : 'Ausente');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔍 Testando consulta simples...');
    
    // Teste 1: Consulta simples sem filtros
    const { data, error } = await supabase
      .from('ordens_servico')
      .select('id')
      .limit(1);
    
    console.log('Resultado:', { data, error });
    
    if (error) {
      console.log('❌ Erro na consulta:', error.message);
      return;
    }
    
    console.log('✅ Supabase funcionando!');
    
    // Teste 2: Consulta específica da OS
    console.log('🔍 Testando OS específica...');
    const osId = '64bdea43-ebb8-4044-85b5-b45c6da1df4a';
    
    const { data: osData, error: osError } = await supabase
      .from('ordens_servico')
      .select('id, numero_os, senha_acesso')
      .eq('id', osId)
      .single();
    
    console.log('OS específica:', { osData, osError });
    
  } catch (err) {
    console.log('❌ Erro geral:', err.message);
  }
}

testConnection();
