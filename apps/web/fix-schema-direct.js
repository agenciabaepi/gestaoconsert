const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fixSchemaDirect() {
  console.log('🔧 Corrigindo schema do banco de dados diretamente...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // 1. Tentar adicionar coluna 'ativo' na tabela empresas
    console.log('\n1️⃣ Adicionando coluna "ativo" na tabela empresas...');
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'empresas' AND column_name = 'ativo'
            ) THEN
              ALTER TABLE empresas ADD COLUMN ativo BOOLEAN DEFAULT true;
              UPDATE empresas SET ativo = true WHERE ativo IS NULL;
            END IF;
          END $$;
        `
      });
      
      if (error) {
        console.log('⚠️  Tentativa com RPC falhou:', error.message);
        console.log('🔄 Tentando abordagem alternativa...');
        
        // Abordagem alternativa: tentar inserir e ver se a coluna existe
        const { data: testData, error: testError } = await supabase
          .from('empresas')
          .select('ativo')
          .limit(1);
        
        if (testError && testError.message.includes('ativo')) {
          console.log('❌ Coluna "ativo" realmente não existe');
        } else {
          console.log('✅ Coluna "ativo" já existe ou foi criada');
        }
      } else {
        console.log('✅ Comando SQL executado com sucesso');
      }
    } catch (err) {
      console.log('❌ Erro ao executar SQL:', err.message);
    }
    
    // 2. Tentar adicionar coluna 'description' na tabela ordens_servico
    console.log('\n2️⃣ Adicionando coluna "description" na tabela ordens_servico...');
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'ordens_servico' AND column_name = 'description'
            ) THEN
              ALTER TABLE ordens_servico ADD COLUMN description TEXT;
            END IF;
          END $$;
        `
      });
      
      if (error) {
        console.log('⚠️  Tentativa com RPC falhou:', error.message);
        console.log('🔄 Tentando abordagem alternativa...');
        
        // Abordagem alternativa: tentar inserir e ver se a coluna existe
        const { data: testData, error: testError } = await supabase
          .from('ordens_servico')
          .select('description')
          .limit(1);
        
        if (testError && testError.message.includes('description')) {
          console.log('❌ Coluna "description" realmente não existe');
        } else {
          console.log('✅ Coluna "description" já existe ou foi criada');
        }
      } else {
        console.log('✅ Comando SQL executado com sucesso');
      }
    } catch (err) {
      console.log('❌ Erro ao executar SQL:', err.message);
    }
    
    // 3. Verificar se as colunas existem agora
    console.log('\n3️⃣ Verificando status final das colunas...');
    
    // Teste coluna ativo
    try {
      const { data: empresasTest, error: empresasError } = await supabase
        .from('empresas')
        .select('id, nome, ativo')
        .limit(1);
      
      if (empresasError) {
        console.log('❌ Coluna "ativo" ainda não existe:', empresasError.message);
      } else {
        console.log('✅ Coluna "ativo" funcionando!');
      }
    } catch (err) {
      console.log('❌ Erro ao testar coluna ativo:', err.message);
    }
    
    // Teste coluna description
    try {
      const { data: ordensTest, error: ordensError } = await supabase
        .from('ordens_servico')
        .select('id, numero_os, description')
        .limit(1);
      
      if (ordensError) {
        console.log('❌ Coluna "description" ainda não existe:', ordensError.message);
      } else {
        console.log('✅ Coluna "description" funcionando!');
      }
    } catch (err) {
      console.log('❌ Erro ao testar coluna description:', err.message);
    }
    
    console.log('\n📋 Diagnóstico completo finalizado.');
    console.log('\n💡 Se as colunas ainda não existem, pode ser necessário:');
    console.log('   1. Acessar o painel do Supabase diretamente');
    console.log('   2. Executar os comandos SQL manualmente');
    console.log('   3. Verificar permissões do service role key');
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }
}

fixSchemaDirect().catch(console.error);