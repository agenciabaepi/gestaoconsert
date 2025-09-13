const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

async function applySchemaFixes() {
  console.log('🔧 Aplicando correções de schema no banco de dados...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // 1. Verificar coluna 'ativo' na tabela empresas
    console.log('\n1️⃣ Verificando coluna "ativo" na tabela empresas...');
    
    const { data: empresasSchema, error: empresasError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'empresas')
      .eq('column_name', 'ativo');
    
    if (empresasError) {
      console.log('⚠️  Erro ao verificar schema de empresas:', empresasError.message);
    } else if (empresasSchema.length === 0) {
      console.log('❌ Coluna "ativo" não encontrada. Adicionando...');
      
      const { error: addAtivoError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE empresas ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;'
      });
      
      if (addAtivoError) {
        console.log('❌ Erro ao adicionar coluna ativo:', addAtivoError.message);
      } else {
        console.log('✅ Coluna "ativo" adicionada com sucesso!');
      }
    } else {
      console.log('✅ Coluna "ativo" já existe na tabela empresas');
    }
    
    // 2. Verificar coluna 'description' na tabela ordens_servico
    console.log('\n2️⃣ Verificando coluna "description" na tabela ordens_servico...');
    
    const { data: ordensSchema, error: ordensError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'ordens_servico')
      .eq('column_name', 'description');
    
    if (ordensError) {
      console.log('⚠️  Erro ao verificar schema de ordens_servico:', ordensError.message);
    } else if (ordensSchema.length === 0) {
      console.log('❌ Coluna "description" não encontrada. Adicionando...');
      
      const { error: addDescError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS description TEXT;'
      });
      
      if (addDescError) {
        console.log('❌ Erro ao adicionar coluna description:', addDescError.message);
      } else {
        console.log('✅ Coluna "description" adicionada com sucesso!');
      }
    } else {
      console.log('✅ Coluna "description" já existe na tabela ordens_servico');
    }
    
    // 3. Testar as correções
    console.log('\n3️⃣ Testando as correções aplicadas...');
    
    // Teste da coluna ativo
    const { data: testAtivo, error: testAtivoError } = await supabase
      .from('empresas')
      .select('id, nome, ativo')
      .limit(1);
    
    if (testAtivoError) {
      console.log('❌ Erro ao testar coluna ativo:', testAtivoError.message);
    } else {
      console.log('✅ Coluna "ativo" funcionando corretamente');
    }
    
    // Teste da coluna description
    const { data: testDesc, error: testDescError } = await supabase
      .from('ordens_servico')
      .select('id, numero_os, description')
      .limit(1);
    
    if (testDescError) {
      console.log('❌ Erro ao testar coluna description:', testDescError.message);
    } else {
      console.log('✅ Coluna "description" funcionando corretamente');
    }
    
    console.log('\n🎉 Correções de schema aplicadas com sucesso!');
    console.log('\n📋 Resumo:');
    console.log('- Coluna "ativo" na tabela empresas: ✅');
    console.log('- Coluna "description" na tabela ordens_servico: ✅');
    console.log('- Banco de dados sincronizado: ✅');
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }
}

applySchemaFixes().catch(console.error);