const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://nxamrvfusyrtkcshehfm.supabase.co';
const supabaseKey = 'sb_publishable_yeCVZiOGAsnR7D9jDDkdNw_r-aOcv31';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQueries() {
    console.log('🔍 TESTANDO QUERIES DO SUPABASE...');
    
    try {
        // Teste 1: Query básica de ordens
        console.log('\n📋 Testando query de ordens...');
        const start1 = Date.now();
        const { data: ordens, error: error1 } = await supabase
            .from('ordens')
            .select('*')
            .limit(10);
        const time1 = Date.now() - start1;
        
        if (error1) {
            console.log('❌ Erro na query de ordens:', error1);
        } else {
            console.log(`✅ Query de ordens OK (${time1}ms) - ${ordens?.length || 0} registros`);
        }
        
        // Teste 2: Query de técnicos
        console.log('\n👥 Testando query de técnicos...');
        const start2 = Date.now();
        const { data: tecnicos, error: error2 } = await supabase
            .from('tecnicos')
            .select('*')
            .limit(10);
        const time2 = Date.now() - start2;
        
        if (error2) {
            console.log('❌ Erro na query de técnicos:', error2);
        } else {
            console.log(`✅ Query de técnicos OK (${time2}ms) - ${tecnicos?.length || 0} registros`);
        }
        
        // Teste 3: Query de clientes
        console.log('\n👤 Testando query de clientes...');
        const start3 = Date.now();
        const { data: clientes, error: error3 } = await supabase
            .from('clientes')
            .select('*')
            .limit(10);
        const time3 = Date.now() - start3;
        
        if (error3) {
            console.log('❌ Erro na query de clientes:', error3);
        } else {
            console.log(`✅ Query de clientes OK (${time3}ms) - ${clientes?.length || 0} registros`);
        }
        
        // Teste 4: Query complexa (como a da página de ordens)
        console.log('\n🔗 Testando query complexa...');
        const start4 = Date.now();
        const { data: ordensComplexa, error: error4 } = await supabase
            .from('ordens')
            .select(`
                *,
                clientes!inner(nome, telefone),
                tecnicos!inner(nome)
            `)
            .limit(5);
        const time4 = Date.now() - start4;
        
        if (error4) {
            console.log('❌ Erro na query complexa:', error4);
        } else {
            console.log(`✅ Query complexa OK (${time4}ms) - ${ordensComplexa?.length || 0} registros`);
        }
        
        // Teste 5: Verificar conectividade
        console.log('\n🌐 Testando conectividade...');
        const start5 = Date.now();
        const { data: test, error: error5 } = await supabase
            .from('ordens')
            .select('id')
            .limit(1);
        const time5 = Date.now() - start5;
        
        if (error5) {
            console.log('❌ Erro de conectividade:', error5);
        } else {
            console.log(`✅ Conectividade OK (${time5}ms)`);
        }
        
    } catch (error) {
        console.log('❌ Erro geral:', error);
    }
}

testQueries();
