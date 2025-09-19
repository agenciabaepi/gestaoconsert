import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set() {},
          remove() {},
        },
      }
    );

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const ordemId = formData.get('ordemId') as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    if (!ordemId) {
      return NextResponse.json(
        { error: 'ID da ordem não fornecido' },
        { status: 400 }
      );
    }

    const uploadedFiles = [];

    for (const file of files) {
      // Verificar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Apenas imagens são permitidas' },
          { status: 400 }
        );
      }

      // Verificar tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Arquivo muito grande. Máximo 5MB por arquivo' },
          { status: 400 }
        );
      }

      // Gerar nome de arquivo seguro
      const timestamp = Date.now();
      const rawName = file.name;
      const safeName = rawName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const filePath = `${ordemId}/${timestamp}_${safeName}`;

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('ordens-imagens')
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        return NextResponse.json(
          { error: 'Erro ao fazer upload da imagem: ' + uploadError.message },
          { status: 500 }
        );
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('ordens-imagens')
        .getPublicUrl(filePath);

      uploadedFiles.push({
        name: file.name,
        url: urlData.publicUrl,
        size: file.size,
        type: file.type
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles
    });

  } catch (error) {
    console.error('Erro geral no upload:', error);
    return NextResponse.json(
      { error: 'Erro inesperado no upload' },
      { status: 500 }
    );
  }
}
