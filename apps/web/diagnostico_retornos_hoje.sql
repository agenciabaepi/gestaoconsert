-- Script para diagnosticar por que o card "Retornos do Dia" mostra 0
-- Execute este script no Supabase SQL Editor

-- 1. Verificar quantas OS existem no total
SELECT 
  'TOTAL DE OS NO BANCO' as info,
  COUNT(*) as quantidade
FROM ordens_servico;

-- 2. Verificar OS criadas hoje
SELECT 
  'OS CRIADAS HOJE' as info,
  COUNT(*) as quantidade
FROM ordens_servico 
WHERE DATE(created_at) = CURRENT_DATE;

-- 3. Verificar OS com tipo 'Retorno'
SELECT 
  'OS TIPO RETORNO' as info,
  COUNT(*) as total,
  COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as hoje
FROM ordens_servico 
WHERE tipo = 'Retorno';

-- 4. Verificar se o campo os_garantia_id existe
SELECT 
  'CAMPO OS_GARANTIA_ID EXISTE?' as info,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'ordens_servico' 
      AND column_name = 'os_garantia_id'
    ) THEN 'SIM' 
    ELSE 'NÃO' 
  END as status;

-- 5. Verificar OS com os_garantia_id preenchido (se o campo existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'ordens_servico' 
    AND column_name = 'os_garantia_id'
  ) THEN
    RAISE NOTICE 'OS com os_garantia_id preenchido: %', (
      SELECT COUNT(*) 
      FROM ordens_servico 
      WHERE os_garantia_id IS NOT NULL
    );
    
    RAISE NOTICE 'OS com os_garantia_id preenchido HOJE: %', (
      SELECT COUNT(*) 
      FROM ordens_servico 
      WHERE os_garantia_id IS NOT NULL 
      AND DATE(created_at) = CURRENT_DATE
    );
  ELSE
    RAISE NOTICE 'Campo os_garantia_id não existe na tabela';
  END IF;
END $$;

-- 6. Verificar a lógica exata do dashboard (retornos hoje)
SELECT 
  'RETORNOS HOJE (LÓGICA DASHBOARD)' as info,
  COUNT(*) as quantidade
FROM ordens_servico 
WHERE DATE(created_at) = CURRENT_DATE
  AND (
    tipo = 'Retorno' 
    OR (
      EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'ordens_servico' 
        AND column_name = 'os_garantia_id'
      )
      AND os_garantia_id IS NOT NULL 
      AND os_garantia_id != ''
    )
  );

-- 7. Mostrar algumas OS de exemplo
SELECT 
  'EXEMPLOS DE OS' as info,
  numero_os,
  tipo,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'ordens_servico' 
      AND column_name = 'os_garantia_id'
    ) THEN COALESCE(os_garantia_id::text, 'NULL')
    ELSE 'CAMPO_NAO_EXISTE'
  END as os_garantia_id_status,
  created_at,
  DATE(created_at) = CURRENT_DATE as eh_hoje
FROM ordens_servico 
ORDER BY created_at DESC 
LIMIT 5;

-- 8. Se não há OS hoje, criar uma de teste
INSERT INTO ordens_servico (
  numero_os,
  cliente_id,
  usuario_id,
  empresa_id,
  categoria,
  marca,
  modelo,
  servico,
  status,
  tipo,
  valor_servico,
  created_at
) 
SELECT 
  'OS-TESTE-HOJE-' || EXTRACT(EPOCH FROM NOW())::text,
  (SELECT id FROM clientes LIMIT 1),
  (SELECT id FROM usuarios LIMIT 1),
  (SELECT empresa_id FROM usuarios LIMIT 1),
  'Smartphone',
  'Samsung',
  'Galaxy S23',
  'Teste - Retorno do dia',
  'Em análise',
  'Retorno',
  0.00,
  NOW()
WHERE EXISTS (SELECT 1 FROM clientes)
  AND EXISTS (SELECT 1 FROM usuarios)
  AND NOT EXISTS (
    SELECT 1 FROM ordens_servico 
    WHERE DATE(created_at) = CURRENT_DATE 
    AND tipo = 'Retorno'
  );

-- 9. Verificar resultado final
SELECT 
  'RESULTADO FINAL' as info,
  COUNT(*) as retornos_hoje
FROM ordens_servico 
WHERE DATE(created_at) = CURRENT_DATE
  AND tipo = 'Retorno';


-- Diagnóstico completo para verificar por que Retornos do Dia mostra 0

-- 1. Verificar se existem OS criadas hoje
SELECT 
  'OS criadas hoje' as tipo,
  COUNT(*) as quantidade
FROM ordens_servico 
WHERE DATE(created_at) = CURRENT_DATE;

-- 2. Verificar OS do tipo 'Retorno' criadas hoje
SELECT 
  'OS tipo Retorno hoje' as tipo,
  COUNT(*) as quantidade
FROM ordens_servico 
WHERE DATE(created_at) = CURRENT_DATE
  AND tipo = 'Retorno';

-- 3. Verificar OS com os_garantia_id preenchido criadas hoje
SELECT 
  'OS com garantia hoje' as tipo,
  COUNT(*) as quantidade
FROM ordens_servico 
WHERE DATE(created_at) = CURRENT_DATE
  AND os_garantia_id IS NOT NULL;

-- 4. Verificar total de retornos (lógica do dashboard)
SELECT 
  'Total retornos hoje (lógica dashboard)' as tipo,
  COUNT(*) as quantidade
FROM ordens_servico 
WHERE DATE(created_at) = CURRENT_DATE
  AND (tipo = 'Retorno' OR os_garantia_id IS NOT NULL);

-- 5. Se não houver dados, criar uma OS de teste para hoje
INSERT INTO ordens_servico (
  numero_os,
  cliente_id,
  usuario_id,
  empresa_id,
  categoria,
  marca,
  modelo,
  servico,
  status,
  tipo,
  valor_servico,
  created_at
) 
SELECT 
  'OS-RETORNO-TESTE-' || EXTRACT(EPOCH FROM NOW())::text,
  (SELECT id FROM clientes LIMIT 1),
  (SELECT id FROM usuarios WHERE auth_user_id = auth.uid() LIMIT 1),
  (SELECT empresa_id FROM usuarios WHERE auth_user_id = auth.uid() LIMIT 1),
  'Smartphone',
  'Apple',
  'iPhone 14',
  'Retorno - Teste para dashboard',
  'Pendente',
  'Retorno',
  0.00,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM ordens_servico 
  WHERE DATE(created_at) = CURRENT_DATE 
    AND tipo = 'Retorno'
);

-- 6. Verificar novamente após inserção
SELECT 
  'Verificação final' as tipo,
  COUNT(*) as retornos_hoje
FROM ordens_servico 
WHERE DATE(created_at) = CURRENT_DATE
  AND (tipo = 'Retorno' OR os_garantia_id IS NOT NULL);