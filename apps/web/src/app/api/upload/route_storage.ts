import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${ordemId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload para o Supabase Storage
      const { error } = await supabase.storage
        .from('ordens-imagens')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Erro no upload:', error);
        return NextResponse.json(
          { error: 'Erro ao fazer upload da imagem: ' + error.message },
          { status: 500 }
        );
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('ordens-imagens')
        .getPublicUrl(fileName);

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
