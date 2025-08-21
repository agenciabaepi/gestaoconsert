

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

interface Props {
  children: React.ReactNode
}

export function InnerWrapper({ children }: Props) {
  const router = useRouter()
  const { usuario, loading } = useAuth()

  useEffect(() => {
    if (!loading && usuario && !usuario.empresa_id) {
      router.replace('/criar-empresa')
    }
  }, [usuario, loading, router])

  if (loading || !usuario || !usuario.empresa_id) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  return <>{children}</>
}