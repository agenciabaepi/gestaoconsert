import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simular dados de componentes UI
    const components = {
      buttons: {
        primary: {
          className: 'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded',
          variants: ['small', 'medium', 'large']
        },
        secondary: {
          className: 'bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded',
          variants: ['small', 'medium', 'large']
        }
      },
      inputs: {
        text: {
          className: 'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline',
          types: ['text', 'email', 'password', 'number']
        }
      },
      cards: {
        default: {
          className: 'bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4',
          variants: ['compact', 'expanded']
        }
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Componentes UI carregados com sucesso',
      data: components,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao carregar componentes UI:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        message: errorMessage,
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { componentType, variant, props } = await request.json();
    
    // Validar dados
    if (!componentType) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Tipo de componente obrigatório',
          message: 'componentType é obrigatório'
        },
        { status: 400 }
      );
    }

    // Simular renderização de componente
    const renderedComponent = {
      type: componentType,
      variant: variant || 'default',
      props: props || {},
      rendered: true,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Componente renderizado com sucesso',
      component: renderedComponent
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao renderizar componente:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        message: errorMessage,
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}