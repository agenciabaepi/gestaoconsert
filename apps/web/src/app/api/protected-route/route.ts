import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  empresa_id: string;
  exp: number;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
      
      // Verificar se o token não expirou
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        return NextResponse.json(
          { error: 'Token expired' },
          { status: 401 }
        );
      }

      // Retornar dados do usuário autenticado
      return NextResponse.json({
        message: 'Access granted to protected route',
        user: {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          empresa_id: decoded.empresa_id
        },
        timestamp: new Date().toISOString()
      });

    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Protected route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Também permitir outros métodos HTTP para testes
export async function POST(request: NextRequest) {
  return GET(request);
}

export async function PUT(request: NextRequest) {
  return GET(request);
}

export async function DELETE(request: NextRequest) {
  return GET(request);
}