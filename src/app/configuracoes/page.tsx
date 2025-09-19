'use client'

import { Suspense, useEffect, useState, lazy } from 'react'
import MenuLayout from '@/components/MenuLayout'
import { Tab } from '@headlessui/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import ProtectedArea from '@/components/ProtectedArea'
import { ToastProvider } from '@/components/Toast'
import { ConfirmProvider } from '@/components/ConfirmDialog'

// Lazy loading das páginas para melhor performance
const EmpresaPage = lazy(() => import('./empresa/page'))
const UsuariosPage = lazy(() => import('./usuarios/page'))
const TermosPage = lazy(() => import('./termos/page'))
const StatusPage = lazy(() => import('./status/page'))
const ComissoesPage = lazy(() => import('./comissoes/page'))
const CatalogoPage = lazy(() => import('./catalogo/page'))
const WhatsAppPage = lazy(() => import('./whatsapp/page'))

// Componente de loading para as páginas filhas
const PageLoader = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
  </div>
)

function ConfiguracoesInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading, usuarioData } = useAuth()
  const [tabIndex, setTabIndex] = useState(0)

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) setTabIndex(Number(tab))
  }, [searchParams])

  const handleTabChange = (index: number) => {
    setTabIndex(index)
    const params = new URLSearchParams(searchParams)
    params.set('tab', index.toString())
    router.replace(`?${params.toString()}`)
  }

  const chave = searchParams.get('chave')
  if (chave) {
    return (
      <div className="p-10">
        <h1 className="text-xl font-bold">Chave recebida: {chave}</h1>
      </div>
    )
  }

  // Se ainda está carregando a autenticação ou dados do usuário, mostra loading
  if (authLoading || !usuarioData) {
    console.log('Aguardando dados do usuário...')
    return (
      <MenuLayout>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </MenuLayout>
    )
  }

  console.log('Renderizando página de configurações:', { nivel: usuarioData.nivel, user: !!user })

  // ✅ CORRIGIDO: Usar diretamente o contexto em vez de estado local
  const isAdmin = usuarioData.nivel === 'admin';
  const tabs = isAdmin
    ? [
        { name: 'Empresa', component: <EmpresaPage /> },
        { name: 'Usuários', component: <UsuariosPage /> },
        { name: 'Comissões', component: <ComissoesPage /> },
        { name: 'Termos de Garantia', component: <TermosPage /> },
        { name: 'Status', component: <StatusPage /> },
        { name: 'Catálogo', component: <CatalogoPage /> },
        { name: 'WhatsApp', component: <WhatsAppPage /> },
      ]
    : usuarioData.nivel === 'atendente'
    ? [
        { name: 'Termos de Garantia', component: <TermosPage /> },
      ]
    : [
        { name: 'Empresa', component: <EmpresaPage /> },
        { name: 'Usuários', component: <UsuariosPage /> },
        { name: 'Comissões', component: <ComissoesPage /> },
        { name: 'Termos de Garantia', component: <TermosPage /> },
        { name: 'Status', component: <StatusPage /> },
        { name: 'Catálogo', component: <CatalogoPage /> },
        { name: 'WhatsApp', component: <WhatsAppPage /> },
      ];

  return (
    <MenuLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Configurações Gerais</h1>
        {/* DEBUG: Exibir nível do usuário na interface */}
        <div className="mb-4 text-xs text-gray-400">Nível detectado: {usuarioData.nivel || 'desconhecido'}</div>

        <Tab.Group selectedIndex={tabIndex} onChange={handleTabChange}>
          <Tab.List className="flex space-x-2 bg-gray-100 p-1 rounded-lg overflow-x-auto">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  `px-4 py-2 font-semibold rounded-md focus:outline-none whitespace-nowrap ${
                    selected
                      ? 'bg-black text-white shadow'
                      : 'text-gray-600 hover:bg-white hover:shadow-sm'
                  }`
                }
              >
                {tab.name}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="mt-6">
            {tabs.map((tab) => (
              <Tab.Panel key={tab.name}>
                <Suspense fallback={<PageLoader />}>
                  {tab.component}
                </Suspense>
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </MenuLayout>
  )
}

export default function ConfiguracoesPage() {
  return (
    <ProtectedArea area="configuracoes">
      <ToastProvider>
        <ConfirmProvider>
          <Suspense fallback={<div className="p-8">Carregando configurações...</div>}>
            <ConfiguracoesInner />
          </Suspense>
        </ConfirmProvider>
      </ToastProvider>
    </ProtectedArea>
  )
}

export const dynamic = 'force-dynamic'