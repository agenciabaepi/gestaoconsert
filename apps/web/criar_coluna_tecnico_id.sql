-- =====================================================
-- CRIAR COLUNA TECNICO_ID NA TABELA USUARIOS
-- =====================================================

-- 1. Verificar estrutura atual da tabela usuarios
SELECT 
  'COLUNAS ATUAIS DA TABELA USUARIOS' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Adicionar coluna tecnico_id se não existir
DO $$
BEGIN
    -- Verificar se a coluna já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' 
          AND column_name = 'tecnico_id' 
          AND table_schema = 'public'
    ) THEN
        -- Adicionar a coluna
        ALTER TABLE usuarios ADD COLUMN tecnico_id UUID;
        RAISE NOTICE 'Coluna tecnico_id adicionada à tabela usuarios';
    ELSE
        RAISE NOTICE 'Coluna tecnico_id já existe na tabela usuarios';
    END IF;
END $$;

-- 3. Preencher tecnico_id com o próprio id do usuário para todos os registros
UPDATE usuarios 
SET tecnico_id = id 
WHERE tecnico_id IS NULL;

-- 4. Verificar quantos usuários foram atualizados
SELECT 
  'USUÁRIOS ATUALIZADOS' as resultado,
  COUNT(*) as total_usuarios_com_tecnico_id
FROM usuarios 
WHERE tecnico_id IS NOT NULL;

-- 5. Criar função para sempre preencher tecnico_id ao inserir novo usuário
CREATE OR REPLACE FUNCTION set_tecnico_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Sempre definir tecnico_id como o próprio id
    NEW.tecnico_id := NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger para novos usuários
DROP TRIGGER IF EXISTS trigger_set_tecnico_id ON usuarios;
CREATE TRIGGER trigger_set_tecnico_id
    BEFORE INSERT ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION set_tecnico_id_on_insert();

-- 7. Mostrar todos os usuários com seus tecnico_id
SELECT 
  'USUÁRIOS COM TECNICO_ID' as resultado,
  id,
  nome,
  nivel,
  auth_user_id,
  tecnico_id,
  CASE 
    WHEN id = tecnico_id THEN 'OK ✅'
    ELSE 'PROBLEMA ❌'
  END as status_tecnico_id
FROM usuarios 
ORDER BY nome;

-- 8. Agora atualizar as OSs para usar o tecnico_id correto
UPDATE ordens_servico 
SET tecnico_id = u.tecnico_id
FROM usuarios u 
WHERE ordens_servico.tecnico_id = u.auth_user_id;

-- 9. Verificar OSs após correção
SELECT 
  'OSs APÓS CORREÇÃO COM TECNICO_ID' as resultado,
  os.numero_os,
  os.tecnico_id,
  u.nome as tecnico_nome,
  u.nivel,
  CASE 
    WHEN os.tecnico_id = u.tecnico_id THEN 'MAPEAMENTO OK ✅'
    ELSE 'PROBLEMA ❌'
  END as status_mapeamento
FROM ordens_servico os
JOIN usuarios u ON os.tecnico_id = u.tecnico_id
WHERE os.tecnico_id IS NOT NULL
ORDER BY os.numero_os DESC
LIMIT 10;

-- 10. Verificar se ainda há problemas de foreign key
SELECT 
  'VERIFICAÇÃO FINAL FK' as verificacao,
  CASE 
    WHEN COUNT(*) = 0 THEN 'TODOS OS TECNICO_IDs VÁLIDOS ✅'
    ELSE CONCAT('AINDA HÁ ', COUNT(*), ' OSs COM PROBLEMA ❌')
  END as status
FROM ordens_servico 
WHERE tecnico_id IS NOT NULL 
  AND tecnico_id NOT IN (SELECT tecnico_id FROM usuarios WHERE tecnico_id IS NOT NULL);

-- 11. Testar inserção de novo usuário (para verificar trigger)
DO $$
DECLARE
    novo_id UUID := gen_random_uuid();
BEGIN
    INSERT INTO usuarios (
        id,
        auth_user_id,
        empresa_id,
        nome,
        email,
        nivel,
        created_at
    ) VALUES (
        novo_id,
        gen_random_uuid()::text,
        (SELECT id FROM empresas LIMIT 1),
        'Usuário Teste Trigger',
        'teste@trigger.com',
        'tecnico',
        NOW()
    );
    
    -- Verificar se tecnico_id foi preenchido automaticamente
    IF EXISTS (
        SELECT 1 FROM usuarios 
        WHERE id = novo_id AND tecnico_id = novo_id
    ) THEN
        RAISE NOTICE 'TRIGGER FUNCIONANDO ✅ - tecnico_id preenchido automaticamente';
        
        -- Remover usuário teste
        DELETE FROM usuarios WHERE id = novo_id;
    ELSE
        RAISE NOTICE 'TRIGGER COM PROBLEMA ❌';
    END IF;
END $$;
