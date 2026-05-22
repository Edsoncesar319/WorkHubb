import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db/queries';
import { formatPrismaError } from '@/lib/db/prisma-errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email: emailParam } = await params;
    const email = decodeURIComponent(emailParam).trim().toLowerCase();
    console.log('Fetching user by email:', email);
    
    const user = await getUserByEmail(email);
    if (!user) {
      // Retornar 404 quando usuário não existe (caso válido)
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error: any) {
    const realError = error?.cause || error;
    const errorMessage = realError?.message || error?.message || '';
    const errorCode = realError?.code || error?.code;
    
    console.error('Error fetching user:', error);
    console.error('Error details:', {
      message: errorMessage,
      code: errorCode,
      stack: error?.stack,
      isVercel: process.env.VERCEL === '1',
      vercelEnv: process.env.VERCEL_ENV
    });
    
    const prismaFormatted = formatPrismaError(error);
    if (prismaFormatted.code === 'PRISMA_API_KEY_INVALID' || prismaFormatted.code === 'DB_UNREACHABLE') {
      return NextResponse.json(
        { error: prismaFormatted.message, code: prismaFormatted.code },
        { status: prismaFormatted.status }
      );
    }

    // Erro específico: tabelas não existem
    if (errorCode === '42P01' || 
        errorMessage.includes('does not exist') || 
        errorMessage.includes('relation') ||
        errorMessage.includes('Tabelas do banco')) {
      return NextResponse.json({ 
        error: errorMessage || 'Database tables not created',
        code: 'TABLES_NOT_EXIST',
        help: 'Execute scripts/create-postgres-tables.sql in Vercel Postgres SQL Editor'
      }, { status: 503 });
    }
    
    // Se o erro for relacionado ao banco não estar disponível,
    // retornar 404 em vez de 500 para permitir que o registro continue
    // (assumindo que o email não existe se o banco não está disponível)
    if (
      errorMessage.includes('missing_connection_string') ||
      errorMessage.includes('not available') ||
      errorMessage.includes('not configured') ||
      errorMessage.includes('Postgres não configurado') ||
      errorMessage.includes('Vercel Postgres não configurado')
    ) {
      return NextResponse.json(
        {
          error: 'Banco de dados não configurado na Vercel',
          code: 'DB_NOT_CONFIGURED',
          help: 'Conecte Storage > Postgres ao projeto e redeploy. Veja VERCEL_SETUP.md',
        },
        { status: 503 }
      );
    }
    
    // Para outros erros, retornar 500
    return NextResponse.json({ 
      error: errorMessage || 'Failed to fetch user',
      code: errorCode,
      details: process.env.NODE_ENV === 'development' ? {
        message: errorMessage,
        code: errorCode
      } : undefined
    }, { status: 500 });
  }
}
