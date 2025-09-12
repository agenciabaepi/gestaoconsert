const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://nxamrvfusyrtkcshehfm.supabase.co', 'sb_publishable_yeCVZiOGAsnR7D9jDDkdNw_r-aOcv31');

const tables = ['os_itens', 'os', 'ordem_servico', 'ordens_servico', 'servicos', 'produtos', 'usuarios', 'users'];

async function testTables() {
  console.log('🔍 TESTANDO TABELAS POSSÍVEIS...');
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: OK (${data?.length || 0} registros)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
}

testTables();
