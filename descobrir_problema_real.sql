-- =====================================================
-- DESCOBRIR O PROBLEMA REAL NO SISTEMA DE COMISSÕES
-- =====================================================

-- 1. ESTRUTURA ATUAL DA TABELA ORDENS_SERVICO
SELECT 
  'ESTRUTURA ORDENS_SERVICO' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'ordens_servico' 
ORDER BY ordinal_position;

-- 2. ESTRUTURA ATUAL DA TABELA USUARIOS  
SELECT 
  'ESTRUTURA USUARIOS' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
AND column_name IN ('id', 'auth_user_id', 'nome', 'nivel', 'comissao_ativa', 'comissao_percentual')
ORDER BY ordinal_position;

-- 3. VERIFICAR SE TABELAS DE COMISSÃO EXISTEM
SELECT 
  'TABELAS EXISTENTES' as info,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name IN ('comissoes_historico', 'configuracoes_comissao')
ORDER BY table_name;

-- 4. VERIFICAR SE TRIGGER E FUNÇÃO EXISTEM
SELECT 
  'TRIGGER EXISTE?' as info,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'trigger_calcular_comissao'
    ) THEN 'SIM' 
    ELSE 'NÃO' 
  END as status;

SELECT 
  'FUNÇÃO EXISTE?' as info,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'calcular_comissao_entrega'
    ) THEN 'SIM' 
    ELSE 'NÃO' 
  END as status;

-- 5. VERIFICAR CONSTRAINT FOREIGN KEY DE TECNICO_ID
SELECT 
  'FOREIGN KEY TECNICO_ID' as info,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'ordens_servico'
  AND kcu.column_name = 'tecnico_id';

-- 6. VERIFICAR DADOS REAIS - USUÁRIOS
SELECT 
  'USUÁRIOS REAIS' as info,
  id,
  nome,
  nivel,
  email,
  auth_user_id,
  CASE WHEN comissao_ativa IS NOT NULL THEN comissao_ativa ELSE false END as comissao_ativa,
  CASE WHEN comissao_percentual IS NOT NULL THEN comissao_percentual ELSE 0 END as comissao_percentual
FROM usuarios 
ORDER BY nome
LIMIT 5;

-- 7. VERIFICAR DADOS REAIS - ORDENS DE SERVIÇO
SELECT 
  'ORDENS DE SERVIÇO REAIS' as info,
  id,
  numero_os,
  tecnico_id,
  status,
  CASE WHEN valor_servico IS NOT NULL THEN valor_servico ELSE 0 END as valor_servico,
  CASE WHEN valor_faturado IS NOT NULL THEN valor_faturado ELSE 0 END as valor_faturado
FROM ordens_servico 
ORDER BY created_at DESC
LIMIT 5;

-- 8. VERIFICAR SE HÁ OSS COM TECNICO_ID INVÁLIDO
SELECT 
  'OSs COM TECNICO_ID INVÁLIDO' as problema,
  COUNT(*) as quantidade
FROM ordens_servico os
WHERE os.tecnico_id IS NOT NULL 
  AND os.tecnico_id NOT IN (SELECT id FROM usuarios);

-- 9. VERIFICAR EMPRESAS
SELECT 
  'EMPRESAS EXISTENTES' as info,
  id,
  nome
FROM empresas
LIMIT 3;

-- 10. VERIFICAR CLIENTES
SELECT 
  'CLIENTES EXISTENTES' as info,
  COUNT(*) as total
FROM clientes;

-- 11. TENTAR IDENTIFICAR O CAMPO CORRETO PARA TÉCNICO
-- No código vemos que usa 'tecnico:usuarios!tecnico_id' então deve ser tecnico_id
SELECT 
  'CAMPO TECNICO NA OS' as info,
  column_name
FROM information_schema.columns 
WHERE table_name = 'ordens_servico' 
  AND column_name LIKE '%tecnico%'
ORDER BY column_name;

-- 12. VERIFICAR SE EXISTE COLUNA USUARIO_ID (visto no SQL schema)
SELECT 
  'CAMPO USUARIO_ID NA OS' as info,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'ordens_servico' 
  AND column_name = 'usuario_id';
