'use client'

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function HeaderAdminSaaS() {
  const pathname = usePathname();
  const parts = (pathname || '').split('/').filter(Boolean);
  const idxAdmin = parts.indexOf('admin-saas');
  const crumbs = parts.slice(idxAdmin + 1);

  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
      <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center gap-2">
        <span className="text-sm text-gray-500">Admin SaaS</span>
        {crumbs.length > 0 && <span className="text-gray-400">/</span>}
        {crumbs.map((c, i) => {
          const href = '/' + parts.slice(0, idxAdmin + 1 + i + 1).join('/');
          const isLast = i === crumbs.length - 1;
          const label = c.replace(/-/g, ' ');
          return (
            <span key={href} className="flex items-center gap-2">
              {isLast ? (
                <span className="text-sm font-medium capitalize">{label}</span>
              ) : (
                <Link href={href} className="text-sm text-gray-600 hover:text-black capitalize">{label}</Link>
              )}
              {!isLast && <span className="text-gray-400">/</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
}


