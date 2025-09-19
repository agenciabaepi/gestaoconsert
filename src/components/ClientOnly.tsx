'use client';

import { useEffect, useState } from 'react';

<<<<<<< HEAD
interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
=======
export default function ClientOnly({ children }: { children: React.ReactNode }) {
>>>>>>> ae80de9f9e96904a86bf9fd02b9f22ffd98f1f2a
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

<<<<<<< HEAD
  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
=======
  if (!hasMounted) return null;

  return <>{children}</>;
}
>>>>>>> ae80de9f9e96904a86bf9fd02b9f22ffd98f1f2a
