const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fixSchema() {
  console.log('🔧 Iniciando correção do schema do banco de dados...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente do Supabase não encontradas');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // 1. Verificar se a coluna já existe
    console.log('📋 Verificando se a coluna description já existe...');
    const { data: columns, error: checkError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'ordens_servico'
          AND column_name = 'description';
        `
      });
    
    if (checkError) {
      console.log('⚠️  Não foi possível verificar via RPC, tentando método alternativo...');
      
      // Método alternativo: tentar adicionar a coluna diretamente
      const { error: alterError } = await supabase
        .rpc('exec_sql', {
          sql: `
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'ordens_servico' 
                    AND column_name = 'description'
                ) THEN
                    ALTER TABLE ordens_servico ADD COLUMN description TEXT;
                    RAISE NOTICE 'Coluna description adicionada à tabela ordens_servico';
                ELSE
                    RAISE NOTICE 'Coluna description já existe na tabela ordens_servico';
                END IF;
            END $$;
          `
        });
      
      if (alterError) {
        console.error('❌ Erro ao executar SQL:', alterError);
        
        // Tentar usando uma abordagem mais simples
        console.log('🔄 Tentando abordagem alternativa...');
        
        try {
          // Tentar adicionar a coluna diretamente (pode falhar se já existir)
          const { error: directError } = await supabase
            .from('ordens_servico')
            .select('description')
            .limit(1);
          
          if (directError && directError.message.includes('column "description" does not exist')) {
            console.log('✅ Confirmado: coluna description não existe. Será necessário adicionar manualmente.');
            console.log('\n📝 Execute este SQL no Supabase Dashboard > SQL Editor:');
            console.log('ALTER TABLE ordens_servico ADD COLUMN description TEXT;');
            console.log('COMMENT ON COLUMN ordens_servico.description IS \'Descrição detalhada da ordem de serviço\';');
          } else {
            console.log('✅ Coluna description já existe na tabela ordens_servico');
          }
        } catch (testError) {
          console.error('❌ Erro ao testar coluna:', testError);
        }
      } else {
        console.log('✅ SQL executado com sucesso!');
      }
    } else {
      if (columns && columns.length > 0) {
        console.log('✅ Coluna description já existe na tabela ordens_servico');
      } else {
        console.log('⚠️  Coluna description não encontrada');
      }
    }
    
    // 2. Verificar estrutura final da tabela
    console.log('\n📊 Verificando estrutura da tabela ordens_servico...');
    const { data: tableStructure, error: structureError } = await supabase
      .from('ordens_servico')
      .select('*')
      .limit(1);
    
    if (!structureError && tableStructure) {
      console.log('✅ Tabela ordens_servico acessível');
      if (tableStructure.length > 0) {
        const columns = Object.keys(tableStructure[0]);
        console.log('📋 Colunas disponíveis:', columns.join(', '));
        
        if (columns.includes('description')) {
          console.log('✅ Coluna description confirmada!');
        } else {
          console.log('❌ Coluna description ainda não está disponível');
        }
      }
    } else {
      console.log('⚠️  Não foi possível verificar a estrutura da tabela');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
  
  console.log('\n🏁 Correção do schema finalizada.');
}

fixSchema();