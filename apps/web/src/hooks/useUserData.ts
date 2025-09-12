import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchUserDataOptimized } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export const useUserData = () => {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['userData', user?.id],
    queryFn: () => fetchUserDataOptimized(user!.id),
    enabled: !!user?.id && !!session,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });
};