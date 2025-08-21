'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

interface ProtectedRouteProps {
  children: ReactNode
  allowedLevels?: string[]
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  allowedLevels = [], 
  redirectTo = '/dashboard' 
}: ProtectedRouteProps) {
<<<<<<< HEAD
  const { user, usuarioData, loading: authLoading, isLoggingOut } = useAuth()
=======
  const { user, session, usuarioData, isLoggingOut } = useAuth()
>>>>>>> stable-version
  const router = useRouter()
  const [userLevel, setUserLevel] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  console.log('🔍 ProtectedRoute renderizado:', {
    user: user ? 'PRESENTE' : 'AUSENTE',
    session: session ? 'PRESENTE' : 'AUSENTE',
    usuarioData: usuarioData ? 'PRESENTE' : 'AUSENTE',
    isLoggingOut: isLoggingOut,
    timestamp: new Date().toISOString()
  });

  // ✅ CORRIGIDO: Adicionar useEffect para redirecionamento
  useEffect(() => {
    if (!user || !session) {
      console.log('🔍 ProtectedRoute: Sem usuário ou sessão, redirecionando...');
      router.replace('/login');
    }
  }, [user, session, router]);

  useEffect(() => {
    console.log('🔍 ProtectedRoute useEffect executado:', {
      user: user ? 'PRESENTE' : 'AUSENTE',
      session: session ? 'PRESENTE' : 'AUSENTE',
      usuarioData: usuarioData ? 'PRESENTE' : 'AUSENTE',
      loading: loading,
      timestamp: new Date().toISOString()
    });

    const checkUserLevel = async () => {
<<<<<<< HEAD
      // Aguardar o contexto de autenticação carregar
      if (authLoading) {
        return
      }

      if (!user) {
=======
      // Verificação simplificada: apenas usuário e sessão
      if (!user || !session) {
        console.log('🔍 ProtectedRoute: Sem usuário ou sessão, aguardando redirecionamento...');
>>>>>>> stable-version
        setLoading(false)
        return
      }

      // Se já temos dados do contexto, usar imediatamente
      if (usuarioData?.nivel) {
        setUserLevel(usuarioData.nivel)
        
        // Se não há restrições de nível ou o usuário tem nível permitido
        if (allowedLevels.length === 0 || allowedLevels.includes(usuarioData.nivel)) {
          setHasAccess(true)
        } else {
          setHasAccess(false)
          router.push(redirectTo)
        }
        setLoading(false)
        return
      }

      // Se não temos dados do contexto, buscar do banco
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('nivel')
          .eq('auth_user_id', user.id)
          .single()

        if (error) {
          console.error('Erro ao buscar nível do usuário:', error)
          setLoading(false)
          return
        }

        setUserLevel(data.nivel)
        
        // Se não há restrições de nível ou o usuário tem nível permitido
        if (allowedLevels.length === 0 || allowedLevels.includes(data.nivel)) {
          setHasAccess(true)
        } else {
          setHasAccess(false)
          router.push(redirectTo)
        }
      } catch (error) {
        console.error('Erro ao verificar nível do usuário:', error)
        setHasAccess(false)
        router.push(redirectTo)
      } finally {
        setLoading(false)
      }
    }

    checkUserLevel()
  }, [user, usuarioData, authLoading, allowedLevels, redirectTo, router])

<<<<<<< HEAD
  if (loading || authLoading) {
=======
  // Se estiver fazendo logout, não mostrar nada para evitar flash da tela de acesso negado
  if (isLoggingOut) {
    console.log('🔍 ProtectedRoute: Logout em andamento, não mostrando conteúdo');
    return null;
  }
  
  // Verificação simplificada: apenas usuário e sessão
  if (!user || !session) {
    console.log('🔍 ProtectedRoute: Sem usuário ou sessão, aguardando redirecionamento...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecionando para login...</p>
        </div>
      </div>
    );
  }
  
  if (loading) {
>>>>>>> stable-version
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Se está fazendo logout, não mostrar nada para evitar a tela de acesso negado
  if (isLoggingOut) {
    return null
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600 mb-4">
            Você não tem permissão para acessar esta página.
          </p>
          <p className="text-sm text-gray-500">
            Seu nível de acesso: <span className="font-medium capitalize">{userLevel}</span>
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 