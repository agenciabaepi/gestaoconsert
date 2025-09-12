'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import logopreto from '@/assets/imagens/logopreto.png';

export default function PoliticasPrivacidadePage() {
  useEffect(() => {
    // Scroll para o topo da página
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <Image
              src={logopreto}
              alt="Consert Logo"
              className="h-16 w-auto object-contain"
              priority
            />
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-4xl font-bold text-gray-900 text-center mb-8">
              Políticas de Privacidade
            </h1>
            
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="text-lg text-gray-600 mb-6 text-center">
                Última atualização: {new Date().toLocaleDateString('pt-BR')}
              </p>

              <div className="space-y-8">
                {/* Introdução */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    1. Introdução
                  </h2>
                  <p className="mb-4">
                    O Consert ("nós", "nosso", "sistema") está comprometido em proteger sua privacidade. 
                    Esta política descreve como coletamos, usamos e protegemos suas informações pessoais 
                    quando você utiliza nosso sistema de gestão de ordens de serviço.
                  </p>
                  <p>
                    Ao usar o Consert, você concorda com as práticas descritas nesta política de privacidade.
                  </p>
                </section>

                {/* Informações Coletadas */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    2. Informações que Coletamos
                  </h2>
                  <div className="space-y-3">
                    <h3 className="text-xl font-medium text-gray-800 mb-2">
                      2.1 Informações da Empresa
                    </h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Nome da empresa</li>
                      <li>CNPJ</li>
                      <li>Endereço e informações de contato</li>
                      <li>Plano de assinatura</li>
                    </ul>

                    <h3 className="text-xl font-medium text-gray-800 mb-2">
                      2.2 Informações dos Usuários
                    </h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Nome completo</li>
                      <li>Endereço de e-mail</li>
                      <li>Nível de acesso (admin, técnico, atendente)</li>
                      <li>Permissões específicas</li>
                      <li>Número de WhatsApp (quando configurado)</li>
                    </ul>

                    <h3 className="text-xl font-medium text-gray-800 mb-2">
                      2.3 Dados das Ordens de Serviço
                    </h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Informações dos clientes (nome, contato)</li>
                      <li>Detalhes dos aparelhos</li>
                      <li>Histórico de serviços</li>
                      <li>Valores e comissões</li>
                    </ul>
                  </div>
                </section>

                {/* Como Usamos */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    3. Como Usamos suas Informações
                  </h2>
                  <p className="mb-4">
                    Utilizamos suas informações para:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Fornecer e manter o sistema Consert</li>
                    <li>Processar ordens de serviço e pagamentos</li>
                    <li>Enviar notificações importantes</li>
                    <li>Enviar mensagens WhatsApp automáticas (quando configurado)</li>
                    <li>Melhorar nossos serviços</li>
                    <li>Cumprir obrigações legais</li>
                  </ul>
                </section>

                {/* Compartilhamento */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    4. Compartilhamento de Informações
                  </h2>
                  <p className="mb-4">
                    Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, 
                    exceto nas seguintes situações:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Com sua autorização explícita</li>
                    <li>Para cumprir obrigações legais</li>
                    <li>Para proteger nossos direitos e propriedade</li>
                    <li>Com provedores de serviços essenciais (WhatsApp Cloud API, Supabase)</li>
                  </ul>
                </section>

                {/* Segurança */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    5. Segurança dos Dados
                  </h2>
                  <p className="mb-4">
                    Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Criptografia de dados em trânsito e em repouso</li>
                    <li>Autenticação segura e controle de acesso</li>
                    <li>Backups regulares e seguros</li>
                    <li>Monitoramento contínuo de segurança</li>
                    <li>Treinamento da equipe em práticas de segurança</li>
                  </ul>
                </section>

                {/* WhatsApp */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    6. Integração com WhatsApp
                  </h2>
                  <p className="mb-4">
                    Quando você ativa o envio automático de mensagens WhatsApp:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Utilizamos a API oficial do WhatsApp Cloud (Meta)</li>
                    <li>As mensagens são enviadas através de templates aprovados</li>
                    <li>Seus dados são processados conforme as políticas da Meta</li>
                    <li>Você pode desativar esta funcionalidade a qualquer momento</li>
                  </ul>
                </section>

                {/* Seus Direitos */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    7. Seus Direitos
                  </h2>
                  <p className="mb-4">
                    Você tem o direito de:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Acessar suas informações pessoais</li>
                    <li>Corrigir dados incorretos</li>
                    <li>Solicitar a exclusão de seus dados</li>
                    <li>Revogar consentimentos dados</li>
                    <li>Exportar seus dados</li>
                    <li>Entrar em contato conosco sobre questões de privacidade</li>
                  </ul>
                </section>

                {/* Cookies */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    8. Cookies e Tecnologias Similares
                  </h2>
                  <p className="mb-4">
                    Utilizamos cookies e tecnologias similares para:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Manter sua sessão ativa</li>
                    <li>Lembrar suas preferências</li>
                    <li>Analisar o uso do sistema</li>
                    <li>Melhorar a experiência do usuário</li>
                  </ul>
                  <p>
                    Você pode controlar o uso de cookies através das configurações do seu navegador.
                  </p>
                </section>

                {/* Retenção */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    9. Retenção de Dados
                  </h2>
                  <p className="mb-4">
                    Mantemos suas informações pelo tempo necessário para:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Fornecer nossos serviços</li>
                    <li>Cumprir obrigações legais</li>
                    <li>Resolver disputas</li>
                    <li>Fazer cumprir nossos acordos</li>
                  </ul>
                  <p>
                    Quando não precisarmos mais dos dados, eles são excluídos de forma segura.
                  </p>
                </section>

                {/* Alterações */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    10. Alterações nesta Política
                  </h2>
                  <p className="mb-4">
                    Podemos atualizar esta política de privacidade periodicamente. 
                    Quando fizermos alterações significativas:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Notificaremos você por e-mail</li>
                    <li>Atualizaremos a data de "última atualização"</li>
                    <li>Destacaremos as mudanças importantes</li>
                  </ul>
                  <p>
                    O uso continuado do sistema após as alterações constitui aceitação da nova política.
                  </p>
                </section>

                {/* Contato */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    11. Entre em Contato
                  </h2>
                  <p className="mb-4">
                    Se você tiver dúvidas sobre esta política de privacidade ou sobre como tratamos seus dados:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">Consert - Sistema de Gestão</p>
                    <p>E-mail: privacidade@consert.app</p>
                    <p>Através do sistema: Acesse as configurações e entre em contato</p>
                  </div>
                </section>

                {/* Conclusão */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    12. Conclusão
                  </h2>
                  <p className="mb-4">
                    Sua privacidade é importante para nós. Estamos comprometidos em proteger suas informações 
                    e em ser transparentes sobre como as utilizamos.
                  </p>
                  <p>
                    Ao usar o Consert, você confia em nós com suas informações, e levamos essa responsabilidade 
                    muito a sério. Trabalhamos continuamente para melhorar nossas práticas de privacidade e 
                    garantir que seus dados estejam seguros.
                  </p>
                </section>
              </div>

              {/* Footer */}
              <div className="mt-12 pt-8 border-t border-gray-200 text-center">
                <p className="text-gray-500 text-sm">
                  © {new Date().getFullYear()} Consert. Todos os direitos reservados.
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  Sistema de Gestão de Ordens de Serviço
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
