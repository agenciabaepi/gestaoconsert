'use client';

import { useSearchParams } from 'next/navigation';
import ClienteForm from '../../../components/ClienteForm';
import ProtectedArea from '@/components/ProtectedArea';
import MenuLayout from '@/components/MenuLayout';
import { Suspense } from 'react';

export default function NovoClientePage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NovoClientePageInner />
    </Suspense>
  );
}

function NovoClientePageInner() {
  const searchParams = useSearchParams();
  const returnToOS = searchParams.get('returnToOS') === 'true';
  return (
    <MenuLayout>
      <ProtectedArea area="clientes">
        <ClienteForm returnToOS={returnToOS} />
      </ProtectedArea>
    </MenuLayout>
  );
}