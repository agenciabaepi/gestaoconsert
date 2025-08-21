import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code') || '';
    const expected = process.env.ADMIN_SAAS_ACCESS_CODE || '';
    if (code && expected && code === expected) {
      const c = await cookies();
      c.set('admin_saas_access', '1', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 dias
      });
      return NextResponse.redirect(new URL('/admin-saas', req.url));
    }
    return NextResponse.redirect(new URL('/admin-saas?err=1', req.url));
  } catch (e) {
    return NextResponse.redirect(new URL('/admin-saas?err=1', req.url));
  }
}


