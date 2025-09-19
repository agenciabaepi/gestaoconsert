export const dynamic = 'force-dynamic';

import NavAdminSaaS from './NavAdminSaaS';
import HeaderAdminSaaS from './HeaderAdminSaaS';

export default function AdminSaaSLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="grid grid-cols-[240px,1fr] gap-0 min-h-screen">
        <aside className="border-r bg-white">
          <NavAdminSaaS />
        </aside>
        <main className="pb-6">
          <HeaderAdminSaaS />
          <div className="p-6 max-w-[1200px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}


