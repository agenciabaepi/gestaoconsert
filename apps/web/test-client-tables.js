const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://nxamrvfusyrtkcshehfm.supabase.co', 'sb_publishable_yeCVZiOGAsnR7D9jDDkdNw_r-aOcv31');

const clientTables = ['clientes', 'cliente', 'customers', 'usuarios'];

async function testClientTables() {
  console.log('🔍 TESTANDO TABELAS DE CLIENTES...');
  
  for (const table of clientTables) {
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

testClientTables();
