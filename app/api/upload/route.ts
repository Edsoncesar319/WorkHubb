import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo fornecido' }, { status: 400 });
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Apenas arquivos de imagem são permitidos' }, { status: 400 });
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'A imagem deve ter no máximo 5MB' }, { status: 400 });
    }

    // Gerar nome único para o arquivo
    // Usar addRandomSuffix: true (melhor prática) para garantir unicidade e evitar sobrescrita acidental
    // Isso cria um caminho como: profile-photos/avatar-123456-oYnXSVczoLa9yBYMFJOSNdaiiervF5.jpg
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `profile-photos/avatar-${timestamp}.${fileExtension}`;

    // Upload para Vercel Blob
    // addRandomSuffix: true garante que cada blob seja único (tratamento como imutável)
    // Isso evita problemas de cache e permite melhor performance
    const blob = await put(fileName, file, {
      access: 'public',
      addRandomSuffix: true, // Melhor prática: trata blobs como imutáveis
      cacheControlMaxAge: 2592000, // Cache de 30 dias (padrão recomendado)
    });

    return NextResponse.json({ 
      url: blob.url,
      pathname: blob.pathname
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ 
      error: error?.message || 'Erro ao fazer upload da imagem' 
    }, { status: 500 });
  }
}

