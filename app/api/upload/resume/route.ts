import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = (formData.get('userId') as string | null)?.trim();

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const typeOk =
      ALLOWED_TYPES.has(file.type) ||
      ALLOWED_EXTENSIONS.includes(ext);

    if (!typeOk) {
      return NextResponse.json(
        { error: 'Formato inválido. Use PDF, DOC ou DOCX.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'O currículo deve ter no máximo 10MB' },
        { status: 400 }
      );
    }

    const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : 'pdf';
    const prefix = userId ? `resumes/${userId}` : 'resumes';
    const blobFileName = `${prefix}/curriculo-${Date.now()}.${safeExt}`;

    const blob = await put(blobFileName, file, {
      access: 'public',
      addRandomSuffix: true,
      contentType: file.type || undefined,
    });

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      fileName: file.name,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Erro ao fazer upload do currículo';
    console.error('Error uploading resume:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
