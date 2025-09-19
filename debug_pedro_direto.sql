-- =====================================================
-- DEBUG PEDRO DIRETO - VERIFICAR TUDO
-- =====================================================

-- 1. Pedro existe mesmo?
SELECT 
  'PEDRO EXISTE?' as verificacao,
  id,
  nome,
  auth_user_id,
  nivel,
  comissao_ativa
FROM usuarios 
WHERE id = '1102c335-5991-43f2-858e-ed130d69edc1';

-- 2. Qual tecnico_id está sendo usado nas OSs?
SELECT 
  'TECNICO_IDs EM USO' as info,
  tecnico_id,
  COUNT(*) as total_os
FROM ordens_servico 
WHERE tecnico_id IS NOT NULL
GROUP BY tecnico_id
ORDER BY total_os DESC;

-- 3. Verificar se Pedro está nas OSs
SELECT 
  'OSs DO PEDRO' as info,
  id,
  numero_os,
  tecnico_id,
  status
FROM ordens_servico 
WHERE tecnico_id = '1102c335-5991-43f2-858e-ed130d69edc1'
LIMIT 5;

-- 4. Verificar qual ID está dando problema
SELECT 
  'IDs PROBLEMÁTICOS' as problema,
  os.tecnico_id,
  COUNT(*) as total_os,
  'Não existe na tabela usuarios' as erro
FROM ordens_servico os
WHERE os.tecnico_id IS NOT NULL 
  AND os.tecnico_id NOT IN (SELECT id FROM usuarios)
GROUP BY os.tecnico_id;

-- 5. FORÇAR: Inserir Pedro se não existir (com dados reais)
INSERT INTO usuarios (
  id,
  auth_user_id,
  empresa_id,
  nome,
  email,
  whatsapp,
  tipo,
  created_at,
  nivel,
  cpf,
  telefone,
  permissoes,
  usuario,
  comissao_percentual,
  comissao_ativa,
  comissao_observacoes
) VALUES (
  '1102c335-5991-43f2-858e-ed130d69edc1',
  '2f17436e-f57a-4c17-8efc-672ad7e85530',
  '22a804a8-b16e-4c6a-8c8f-9f6b1d8784ed',
  'Pedro Oliveira',
  'pedro@gmail.com',
  '12312312312',
  'principal',
  '2025-08-04 18:04:58.50286',
  'tecnico',
  '12312312312',
  '',
  '{"bancada","dashboard"}',
  'pedro',
  10.00,
  true,
  'Comissão ativada - 10% sobre serviços'
) ON CONFLICT (id) DO UPDATE SET
  comissao_ativa = true,
  comissao_percentual = 10.00;

-- 6. Verificar novamente
SELECT 
  'PEDRO APÓS INSERÇÃO' as resultado,
  id,
  nome,
  nivel,
  comissao_ativa,
  comissao_percentual
FROM usuarios 
WHERE id = '1102c335-5991-43f2-858e-ed130d69edc1';

-- 7. Testar UPDATE direto na OS #918
UPDATE ordens_servico 
SET 
  tecnico_id = '1102c335-5991-43f2-858e-ed130d69edc1',
  status = 'ORCAMENTO' -- Manter o status original
WHERE numero_os = '918';

-- 8. Verificar se deu certo
SELECT 
  'OS #918 APÓS UPDATE' as resultado,
  id,
  numero_os,
  tecnico_id,
  status,
  CASE 
    WHEN tecnico_id IN (SELECT id FROM usuarios) THEN 'FK OK ✅'
    ELSE 'FK PROBLEMA ❌'
  END as foreign_key_status
FROM ordens_servico 
WHERE numero_os = '918';
