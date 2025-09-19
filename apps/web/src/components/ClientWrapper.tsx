'use client'

import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

interface Props {
  children: React.ReactNode
}

export default function ClientWrapper({ children }: Props) {
  const { usuarioData } = useAuth()

  useEffect(() => {
    // verificações temporariamente removidas
  }, [])

  return <>{children}</>
}