const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSchema() {
  try {
    console.log('🔧 Iniciando correção do schema da tabela ordens_servico...');
    
    // Verificar se a coluna description já existe
    const { data: columns, error: columnsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'ordens_servico' 
          AND column_name = 'description'
        `
      });
    
    if (columnsError) {
      console.log('⚠️  Tentando método alternativo para verificar coluna...');
      
      // Método alternativo: tentar adicionar a coluna diretamente
      const { data, error } = await supabase
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
      
      if (error) {
        console.error('❌ Erro ao executar SQL:', error);
        
        // Tentar método mais simples
        console.log('🔄 Tentando método mais simples...');
        const { data: simpleResult, error: simpleError } = await supabase
          .from('ordens_servico')
          .select('description')
          .limit(1);
        
        if (simpleError && simpleError.message.includes('column "description" does not exist')) {
          console.log('✅ Confirmado: coluna description não existe. Tentando adicionar...');
          
          // Usar raw SQL através de uma função personalizada ou RPC
          console.log('📝 Execute manualmente no Supabase SQL Editor:');
          console.log('ALTER TABLE ordens_servico ADD COLUMN description TEXT;');
          console.log('COMMENT ON COLUMN ordens_servico.description IS \'Descrição detalhada da ordem de serviço\';');
          
        } else if (!simpleError) {
          console.log('✅ Coluna description já existe!');
        } else {
          console.error('❌ Erro inesperado:', simpleError);
        }
      } else {
        console.log('✅ SQL executado com sucesso!');
        console.log('Resultado:', data);
      }
    } else {
      if (columns && columns.length > 0) {
        console.log('✅ Coluna description já existe na tabela ordens_servico');
      } else {
        console.log('❌ Coluna description não existe. Execute manualmente no Supabase:');
        console.log('ALTER TABLE ordens_servico ADD COLUMN description TEXT;');
      }
    }
    
    // Verificar estrutura atual da tabela
    console.log('\n📋 Verificando estrutura atual da tabela ordens_servico...');
    const { data: tableStructure, error: structureError } = await supabase
      .from('ordens_servico')
      .select('*')
      .limit(0);
    
    if (!structureError) {
      console.log('✅ Tabela ordens_servico acessível');
    } else {
      console.log('⚠️  Erro ao acessar tabela:', structureError.message);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixSchema();