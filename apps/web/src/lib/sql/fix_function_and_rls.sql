-- =====================================================
-- CORRIGIR FUNÇÃO E RLS PARA TABELA EXISTENTE
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. CRIAR A FUNÇÃO registrar_mudanca_status
CREATE OR REPLACE FUNCTION registrar_mudanca_status(
  p_os_id UUID,
  p_status_anterior VARCHAR(50),
  p_status_novo VARCHAR(50),
  p_status_tecnico_anterior VARCHAR(50),
  p_status_tecnico_novo VARCHAR(50),
  p_usuario_id UUID,
  p_motivo TEXT DEFAULT NULL,
  p_observacoes TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_historico_id UUID;
  v_usuario_nome VARCHAR(255);
  v_tempo_anterior INTERVAL;
BEGIN
  -- Buscar nome do usuário (pode ser NULL se usuário não existir)
  IF p_usuario_id IS NOT NULL THEN
    SELECT nome INTO v_usuario_nome FROM usuarios WHERE id = p_usuario_id;
  END IF;
  
  -- Se não encontrou o nome, usar um padrão
  IF v_usuario_nome IS NULL THEN
    v_usuario_nome := 'Sistema';
  END IF;
  
  -- Calcular tempo no status anterior
  SELECT 
    NOW() - MAX(created_at) 
  INTO v_tempo_anterior
  FROM status_historico 
  WHERE os_id = p_os_id;
  
  -- Inserir registro de histórico
  INSERT INTO status_historico (
    os_id,
    status_anterior,
    status_novo,
    status_tecnico_anterior,
    status_tecnico_novo,
    usuario_id,
    usuario_nome,
    motivo,
    observacoes,
    tempo_no_status_anterior,
    ip_address,
    user_agent
  ) VALUES (
    p_os_id,
    p_status_anterior,
    p_status_novo,
    p_status_tecnico_anterior,
    p_status_tecnico_novo,
    p_usuario_id,
    v_usuario_nome,
    p_motivo,
    p_observacoes,
    v_tempo_anterior,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_historico_id;
  
  RETURN v_historico_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. DESABILITAR RLS TEMPORARIAMENTE PARA TESTES
ALTER TABLE status_historico DISABLE ROW LEVEL SECURITY;

-- 3. TESTAR A FUNÇÃO
SELECT registrar_mudanca_status(
  (SELECT id FROM ordens_servico LIMIT 1), -- Pegar uma OS qualquer para teste
  'TESTE_ANTERIOR',
  'TESTE_NOVO', 
  'TECNICO_ANTERIOR',
  'TECNICO_NOVO',
  (SELECT id FROM usuarios LIMIT 1), -- Pegar um usuário qualquer
  'Teste da função',
  'Teste de observações'
) as teste_funcao;

-- 4. VERIFICAR SE FOI INSERIDO
SELECT 'Registros na tabela:', COUNT(*) FROM status_historico;

-- 5. MOSTRAR ÚLTIMOS REGISTROS
SELECT 
  id,
  os_id,
  status_anterior,
  status_novo,
  usuario_nome,
  motivo,
  created_at
FROM status_historico 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. REABILITAR RLS COM POLÍTICAS PERMISSIVAS (PARA TESTES)
ALTER TABLE status_historico ENABLE ROW LEVEL SECURITY;

-- Política permissiva para leitura (qualquer usuário autenticado)
CREATE POLICY "Permitir leitura para usuários autenticados" 
ON status_historico FOR SELECT 
TO authenticated 
USING (true);

-- Política permissiva para inserção (qualquer usuário autenticado)
CREATE POLICY "Permitir inserção para usuários autenticados" 
ON status_historico FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Política permissiva para atualização (qualquer usuário autenticado)
CREATE POLICY "Permitir atualização para usuários autenticados" 
ON status_historico FOR UPDATE 
TO authenticated 
USING (true);

SELECT 'Script executado com sucesso!' as resultado;
