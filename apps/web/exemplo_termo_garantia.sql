-- Exemplo de termo de garantia (substitua o empresa_id pelo ID da sua empresa)
INSERT INTO termos_garantia (
  empresa_id,
  nome,
  conteudo,
  ativo,
  ordem
) VALUES (
  'SEU_EMPRESA_ID_AQUI', -- Substitua pelo ID da sua empresa
  'Garantia Padrão 90 Dias',
  '<h2>Termos de Garantia - 90 Dias</h2>
  
  <p><strong>1. Cobertura da Garantia</strong></p>
  <p>Esta garantia cobre defeitos de fabricação e problemas de funcionamento do equipamento por um período de 90 dias a partir da data de conclusão do serviço.</p>
  
  <p><strong>2. O que está coberto:</strong></p>
  <ul>
    <li>Defeitos de fabricação</li>
    <li>Problemas de funcionamento</li>
    <li>Falhas em peças substituídas</li>
    <li>Problemas relacionados ao serviço executado</li>
  </ul>
  
  <p><strong>3. O que NÃO está coberto:</strong></p>
  <ul>
    <li>Danos causados por uso inadequado</li>
    <li>Danos por queda ou impacto</li>
    <li>Problemas causados por líquidos</li>
    <li>Danos por tentativa de reparo não autorizada</li>
    <li>Desgaste natural do equipamento</li>
  </ul>
  
  <p><strong>4. Procedimentos para Garantia</strong></p>
  <p>Para acionar a garantia, o cliente deve:</p>
  <ol>
    <li>Entrar em contato conosco dentro do prazo de 90 dias</li>
    <li>Apresentar a OS original</li>
    <li>Descrever o problema detalhadamente</li>
    <li>Trazer o equipamento para avaliação</li>
  </ol>
  
  <p><strong>5. Prazo de Reparo</strong></p>
  <p>O prazo para reparo em garantia é de até 15 dias úteis, podendo variar conforme a complexidade do problema.</p>
  
  <p><strong>6. Exclusões</strong></p>
  <p>Esta garantia não cobre:</p>
  <ul>
    <li>Dados perdidos durante o reparo</li>
    <li>Danos estéticos não relacionados ao serviço</li>
    <li>Problemas em equipamentos com modificações não autorizadas</li>
  </ul>
  
  <p><em>Esta garantia é válida apenas para o serviço específico realizado e não se estende a outros problemas não relacionados.</em></p>',
  true,
  1
); 