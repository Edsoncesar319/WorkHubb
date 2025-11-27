import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    
    // Suportar tanto FormData (arquivo) quanto JSON (base64 string)
    let file: File | null = null;
    let base64String: string | null = null;
    let fileName: string = 'avatar.jpg';

    if (contentType?.includes('multipart/form-data')) {
      // Upload de arquivo via FormData
      const formData = await request.formData();
      file = formData.get('file') as File;
      const customFileName = formData.get('fileName') as string | null;
      if (customFileName) fileName = customFileName;
    } else {
      // Upload de base64 string via JSON
      const body = await request.json();
      base64String = body.base64 || body.data || null;
      fileName = body.fileName || 'avatar.jpg';
    }

    // Validar que temos dados para upload
    if (!file && !base64String) {
      return NextResponse.json({ error: 'Nenhum arquivo ou dados fornecidos' }, { status: 400 });
    }

    // Se for base64, converter para Blob
    if (base64String) {
      // Remover prefixo data:image/...;base64, se existir
      const base64Data = base64String.includes(',') 
        ? base64String.split(',')[1] 
        : base64String;
      
      // Validar tamanho (max 5MB em base64)
      const sizeInBytes = (base64Data.length * 3) / 4;
      if (sizeInBytes > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'A imagem deve ter no máximo 5MB' }, { status: 400 });
      }

      // Converter base64 para Buffer
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Determinar tipo MIME do base64
      const mimeMatch = base64String.match(/data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      
      // Criar File a partir do Buffer
      file = new File([buffer], fileName, { type: mimeType });
    }

    if (!file) {
      return NextResponse.json({ error: 'Erro ao processar arquivo' }, { status: 400 });
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
    const timestamp = Date.now();
    const fileExtension = fileName.split('.').pop() || file.type.split('/')[1] || 'jpg';
    const blobFileName = `profile-photos/avatar-${timestamp}.${fileExtension}`;

    // Upload para Vercel Blob
    // addRandomSuffix: true garante que cada blob seja único (tratamento como imutável)
    // Isso evita problemas de cache e permite melhor performance
    const blob = await put(blobFileName, file, {
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

