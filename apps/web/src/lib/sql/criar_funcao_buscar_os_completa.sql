-- =====================================================
-- FUNÇÃO PARA BUSCAR OS COMPLETA (PÚBLICA)
-- =====================================================

-- Criar função que retorna dados completos da OS
CREATE OR REPLACE FUNCTION buscar_os_completa(os_id UUID)
RETURNS TABLE (
  id UUID,
  numero_os VARCHAR,
  categoria VARCHAR,
  marca VARCHAR,
  modelo VARCHAR,
  status VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE,
  servico TEXT,
  observacao TEXT,
  problema_relatado TEXT,
  condicoes_equipamento TEXT,
  cliente_nome VARCHAR,
  cliente_telefone VARCHAR,
  cliente_email VARCHAR,
  tecnico_nome VARCHAR,
  empresa_nome VARCHAR,
  empresa_telefone VARCHAR,
  empresa_email VARCHAR,
  empresa_logo_url TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    os.id,
    os.numero_os,
    os.categoria,
    os.marca,
    os.modelo,
    os.status,
    os.created_at,
    os.servico,
    os.observacao,
    os.problema_relatado,
    os.condicoes_equipamento,
    c.nome as cliente_nome,
    c.telefone as cliente_telefone,
    c.email as cliente_email,
    u.nome as tecnico_nome,
    e.nome as empresa_nome,
    e.telefone as empresa_telefone,
    e.email as empresa_email,
    e.logo_url as empresa_logo_url
  FROM ordens_servico os
  LEFT JOIN clientes c ON os.cliente_id = c.id
  LEFT JOIN usuarios u ON os.tecnico_id = u.id
  LEFT JOIN empresas e ON os.empresa_id = e.id
  WHERE os.id = os_id;
END;
$$;

-- Dar permissão para usuários anônimos executarem a função
GRANT EXECUTE ON FUNCTION buscar_os_completa(UUID) TO anon;
GRANT EXECUTE ON FUNCTION buscar_os_completa(UUID) TO authenticated;
