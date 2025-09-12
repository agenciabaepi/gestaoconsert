#!/usr/bin/env node

/**
 * Script para configurar automaticamente as tabelas de sessões
 * Execute: node scripts/setup-sessions.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Configurando tabelas de sessões...\n');

// Ler o arquivo SQL
const sqlFile = path.join(__dirname, '../database/create_session_tables.sql');
const sqlContent = fs.readFileSync(sqlFile, 'utf8');

console.log('📋 SQL encontrado:', sqlFile);
console.log('📏 Tamanho:', sqlContent.length, 'caracteres');

// Instruções para o usuário
console.log('\n📝 INSTRUÇÕES PARA EXECUTAR:');
console.log('=====================================');
console.log('1. Acesse o Supabase Dashboard');
console.log('2. Vá para SQL Editor');
console.log('3. Cole o conteúdo do arquivo:');
console.log('   database/create_session_tables.sql');
console.log('4. Clique em "Run"');
console.log('5. Aguarde a execução');
console.log('6. Verifique se não há erros');
console.log('\n📋 Ou execute diretamente:');
console.log('   cat database/create_session_tables.sql | pbcopy');
console.log('   (Isso copia o SQL para a área de transferência)');

// Verificar se o arquivo existe
if (!fs.existsSync(sqlFile)) {
  console.error('❌ Arquivo SQL não encontrado:', sqlFile);
  process.exit(1);
}

// Mostrar preview do SQL
console.log('\n📄 PREVIEW DO SQL:');
console.log('=====================================');
console.log(sqlContent.substring(0, 500) + '...');
console.log('\n[arquivo continua...]');

console.log('\n✅ Script de configuração pronto!');
console.log('🎯 Execute o SQL no Supabase para ativar o sistema de sessões.');
