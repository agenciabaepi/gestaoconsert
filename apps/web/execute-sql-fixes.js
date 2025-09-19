const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function executeSQLFixes() {
  console.log('🔧 Executando correções SQL diretamente no Supabase...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Tentar adicionar coluna 'ativo' na tabela empresas
    console.log('\n1️⃣ Adicionando coluna "ativo" na tabela empresas...');
    
    const { data: empresasResult, error: empresasError } = await supabase
      .from('empresas')
      .select('ativo')
      .limit(1);
    
    if (empresasError && empresasError.message.includes('column "ativo" does not exist')) {
      console.log('❌ Coluna "ativo" não existe, tentando criar...');
      
      // Tentar executar SQL diretamente
      const { data: sqlResult1, error: sqlError1 } = await supabase
        .rpc('exec_sql', {
          sql: 'ALTER TABLE empresas ADD COLUMN ativo BOOLEAN DEFAULT true;'
        });
      
      if (sqlError1) {
        console.log('⚠️  Erro ao executar SQL:', sqlError1.message);
        
        // Tentar abordagem alternativa usando insert/update
        console.log('🔄 Tentando abordagem alternativa...');
        
        // Verificar se podemos pelo menos acessar a tabela
        const { data: testEmpresas, error: testError } = await supabase
          .from('empresas')
          .select('id')
          .limit(1);
        
        if (testError) {
          console.log('❌ Erro ao acessar tabela empresas:', testError.message);
        } else {
          console.log('✅ Tabela empresas acessível, mas coluna "ativo" precisa ser criada manualmente');
        }
      } else {
        console.log('✅ Coluna "ativo" criada com sucesso!');
      }
    } else if (empresasError) {
      console.log('❌ Erro ao verificar coluna "ativo":', empresasError.message);
    } else {
      console.log('✅ Coluna "ativo" já existe!');
    }

    // 2. Tentar adicionar coluna 'description' na tabela ordens_servico
    console.log('\n2️⃣ Adicionando coluna "description" na tabela ordens_servico...');
    
    const { data: ordensResult, error: ordensError } = await supabase
      .from('ordens_servico')
      .select('description')
      .limit(1);
    
    if (ordensError && ordensError.message.includes('column "description" does not exist')) {
      console.log('❌ Coluna "description" não existe, tentando criar...');
      
      // Tentar executar SQL diretamente
      const { data: sqlResult2, error: sqlError2 } = await supabase
        .rpc('exec_sql', {
          sql: 'ALTER TABLE ordens_servico ADD COLUMN description TEXT;'
        });
      
      if (sqlError2) {
        console.log('⚠️  Erro ao executar SQL:', sqlError2.message);
        
        // Verificar se podemos pelo menos acessar a tabela
        const { data: testOrdens, error: testError2 } = await supabase
          .from('ordens_servico')
          .select('id')
          .limit(1);
        
        if (testError2) {
          console.log('❌ Erro ao acessar tabela ordens_servico:', testError2.message);
        } else {
          console.log('✅ Tabela ordens_servico acessível, mas coluna "description" precisa ser criada manualmente');
        }
      } else {
        console.log('✅ Coluna "description" criada com sucesso!');
      }
    } else if (ordensError) {
      console.log('❌ Erro ao verificar coluna "description":', ordensError.message);
    } else {
      console.log('✅ Coluna "description" já existe!');
    }

    // 3. Verificação final
    console.log('\n3️⃣ Verificação final das colunas...');
    
    // Testar coluna ativo
    const { data: finalEmpresas, error: finalEmpresasError } = await supabase
      .from('empresas')
      .select('ativo')
      .limit(1);
    
    if (finalEmpresasError) {
      console.log('❌ Coluna "ativo" ainda não existe:', finalEmpresasError.message);
    } else {
      console.log('✅ Coluna "ativo" verificada com sucesso!');
    }
    
    // Testar coluna description
    const { data: finalOrdens, error: finalOrdensError } = await supabase
      .from('ordens_servico')
      .select('description')
      .limit(1);
    
    if (finalOrdensError) {
      console.log('❌ Coluna "description" ainda não existe:', finalOrdensError.message);
    } else {
      console.log('✅ Coluna "description" verificada com sucesso!');
    }

    console.log('\n📋 Diagnóstico completo finalizado.');
    
    if (finalEmpresasError || finalOrdensError) {
      console.log('\n💡 SOLUÇÃO RECOMENDADA:');
      console.log('   1. Acesse o painel do Supabase: https://supabase.com/dashboard');
      console.log('   2. Vá para SQL Editor');
      console.log('   3. Execute o arquivo fix-database-schema.sql manualmente');
      console.log('   4. Ou execute os comandos SQL individuais:');
      
      if (finalEmpresasError) {
        console.log('      ALTER TABLE empresas ADD COLUMN ativo BOOLEAN DEFAULT true;');
      }
      
      if (finalOrdensError) {
        console.log('      ALTER TABLE ordens_servico ADD COLUMN description TEXT;');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

executeSQLFixes().catch(console.error);