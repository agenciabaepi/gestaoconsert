import ProtectedArea from '@/components/ProtectedArea';
import MenuLayout from '@/components/MenuLayout';

export default function TermosPage() {
  return (
    <ProtectedArea area="termos">
      <MenuLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Termos de Uso</h1>
          <p className="text-gray-600">Página em desenvolvimento...</p>
        </div>
      </MenuLayout>
    </ProtectedArea>
  );
} 