

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

interface Props {
  children: React.ReactNode
}

export function InnerWrapper({ children }: Props) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user && !user.email) {
      router.replace('/criar-empresa')
    }
  }, [user, loading, router])

  if (loading || !user || !user.email) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  return <>{children}</>
}