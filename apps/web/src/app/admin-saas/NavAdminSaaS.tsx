'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/admin-saas', label: 'Visão geral' },
  { href: '/admin-saas/empresas', label: 'Empresas' },
  { href: '/admin-saas/assinaturas', label: 'Assinaturas' },
  { href: '/admin-saas/pagamentos', label: 'Pagamentos' },
  { href: '/admin-saas/usuarios', label: 'Usuários' },
  { href: '/admin-saas/config', label: 'Configurações' },
];

export default function NavAdminSaaS() {
  const pathname = usePathname();
  return (
    <nav className="h-full p-4 flex flex-col">
      <div className="text-lg font-semibold mb-4">Admin SaaS</div>
      <ul className="space-y-1">
        {links.map(l => {
          const active = pathname === l.href;
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                className={
                  'block rounded px-3 py-2 text-sm ' +
                  (active ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-800')
                }
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto text-xs text-gray-500">by AgilizaOS</div>
    </nav>
  );
}


