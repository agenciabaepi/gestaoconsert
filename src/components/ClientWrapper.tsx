'use client'

import { useEffect } from 'react'
import { useUsuario } from '@/context/AuthContext'

interface Props {
  children: React.ReactNode
}

export default function ClientWrapper({ children }: Props) {
  const usuarioData = useUsuario()

  useEffect(() => {
    // verificações temporariamente removidas
  }, [])

  return <>{children}</>
}