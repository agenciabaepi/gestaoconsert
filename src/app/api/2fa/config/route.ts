import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

const BUCKET = 'admin-2fa';

function getSupabaseAdmin() {
  return createClient(supabaseUrl, serviceKey);
}

// Simple AES-256-GCM encryption helpers
const ENC_ALG = 'aes-256-gcm';
const ENC_KEY = crypto
  .createHash('sha256')
  .update(process.env.TWOFA_ENC_SECRET || serviceKey || 'fallback-secret')
  .digest();

function encryptJson(obj: unknown) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENC_ALG, ENC_KEY, iv);
  const json = JSON.stringify(obj);
  const enc = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

function decryptJson(b64: string) {
  const buf = Buffer.from(b64, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ENC_ALG, ENC_KEY, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  return JSON.parse(dec);
}

async function ensureBucket() {
  const supabase = getSupabaseAdmin();
  // Try create bucket; ignore error if exists
  await supabase.storage.createBucket(BUCKET, { public: false }).catch(() => {});
}

function getEmail(req: NextRequest): string | null {
  // For this admin, we authorize by fixed email from body or header (since no Supabase Auth)
  const email = req.headers.get('x-admin-email');
  return email && email.includes('@') ? email : null;
}

export async function GET(req: NextRequest) {
  try {
    const email = getEmail(req);
    if (!email) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    await ensureBucket();
    const supabase = getSupabaseAdmin();
    const path = `users/${encodeURIComponent(email)}.json`;
    const { data, error } = await supabase.storage.from(BUCKET).download(path);
    if (error) return NextResponse.json({ ok: true, data: { enabled: false, setupComplete: false } });
    const text = await data.text();
    const json = decryptJson(text);
    return NextResponse.json({ ok: true, data: json });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const email = getEmail(req);
    if (!email) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    const body = await req.json();
    await ensureBucket();
    const supabase = getSupabaseAdmin();
    const path = `users/${encodeURIComponent(email)}.json`;
    const enc = encryptJson(body);
    const { error } = await supabase.storage.from(BUCKET).upload(path, enc, {
      upsert: true,
      contentType: 'text/plain'
    });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const email = getEmail(req);
    if (!email) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    await ensureBucket();
    const supabase = getSupabaseAdmin();
    const path = `users/${encodeURIComponent(email)}.json`;
    await supabase.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}


