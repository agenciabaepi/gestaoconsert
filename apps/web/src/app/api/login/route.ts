import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    let emailToLogin = username;

    // Verificar se é email ou usuário
    if (!username.includes('@')) {
      const usernameNormalized = username.trim().toLowerCase();
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('email')
        .eq('usuario', usernameNormalized)
        .single();
      
      if (error || !usuario?.email) {
        return NextResponse.json(
          { error: 'User not found. Please check your username.' },
          { status: 404 }
        );
      }
      emailToLogin = usuario.email;
    }

    // Verificar se o email foi confirmado ANTES de tentar login
    const { data: usuarioVerificacao, error: verificacaoError } = await supabase
      .from('usuarios')
      .select('email_verificado, auth_user_id, nivel, empresa_id')
      .eq('email', emailToLogin)
      .single();
    
    if (verificacaoError) {
      return NextResponse.json(
        { error: 'User not found. Please check your credentials.' },
        { status: 404 }
      );
    }

    // Se o usuário é ADMIN (criador da empresa), verificar se o email foi confirmado
    if (usuarioVerificacao?.nivel === 'admin' && !usuarioVerificacao?.email_verificado) {
      return NextResponse.json(
        { error: 'Email not verified. Please verify your email before logging in.' },
        { status: 403 }
      );
    }

    // Se o usuário NÃO é admin, verificar se o ADMIN da empresa foi verificado
    if (usuarioVerificacao?.nivel !== 'admin' && usuarioVerificacao?.empresa_id) {
      const { data: adminEmpresa, error: adminError } = await supabase
        .from('usuarios')
        .select('email_verificado')
        .eq('empresa_id', usuarioVerificacao.empresa_id)
        .eq('nivel', 'admin')
        .single();
      
      if (adminError) {
        return NextResponse.json(
          { error: 'Error verifying company. Please try again.' },
          { status: 500 }
        );
      }
      
      if (!adminEmpresa?.email_verificado) {
        return NextResponse.json(
          { error: 'Company not verified. Please contact the administrator.' },
          { status: 403 }
        );
      }
    }

    // Tentar fazer login usando Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: emailToLogin,
      password,
    });

    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: 'Invalid email or password. Please check your credentials.' },
          { status: 401 }
        );
      } else if (authError.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { error: 'Email not confirmed. Please check your inbox.' },
          { status: 403 }
        );
      } else {
        return NextResponse.json(
          { error: 'Login failed. Please try again.' },
          { status: 401 }
        );
      }
    }

    if (!authData?.session?.user) {
      return NextResponse.json(
        { error: 'Authentication failed. Please try again.' },
        { status: 401 }
      );
    }

    // Buscar dados do usuário
    const userId = authData.session.user.id;
    const { data: perfil, error: perfilError } = await supabase
      .from('usuarios')
      .select('nivel, empresa_id')
      .eq('auth_user_id', userId)
      .single();
    
    if (perfilError || !perfil) {
      return NextResponse.json(
        { error: 'Error fetching user profile. Please try again.' },
        { status: 500 }
      );
    }

    if (!perfil.empresa_id) {
      return NextResponse.json(
        { error: 'User has no associated company. Please contact support.' },
        { status: 400 }
      );
    }

    // Gerar JWT token personalizado
    const token = jwt.sign(
      {
        userId: userId,
        email: emailToLogin,
        role: perfil.nivel,
        empresa_id: perfil.empresa_id,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 horas
      },
      jwtSecret
    );

    return NextResponse.json({
      token,
      role: perfil.nivel,
      user: {
        id: userId,
        email: emailToLogin,
        nivel: perfil.nivel,
        empresa_id: perfil.empresa_id
      },
      session: authData.session
    });

  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}