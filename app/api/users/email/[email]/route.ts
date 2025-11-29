import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email: emailParam } = await params;
    const email = decodeURIComponent(emailParam);
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
      stack: error?.stack
    });
    
    // Erro específico: tabelas não existem
    if (errorCode === '42P01' || errorMessage.includes('does not exist') || errorMessage.includes('relation')) {
      return NextResponse.json({ 
        error: 'Database tables not created. Please execute scripts/create-postgres-tables.sql in Vercel Postgres console.',
        code: 'TABLES_NOT_EXIST'
      }, { status: 503 });
    }
    
    // Se o erro for relacionado ao banco não estar disponível,
    // retornar 404 em vez de 500 para permitir que o registro continue
    // (assumindo que o email não existe se o banco não está disponível)
    if (errorMessage.includes('not available') || 
        errorMessage.includes('not configured') ||
        errorMessage.includes('Vercel Postgres não configurado') ||
        errorMessage.includes('Failed to create')) {
      console.warn('Database not available, returning 404 to allow registration');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Para outros erros, retornar 500
    return NextResponse.json({ 
      error: errorMessage || 'Failed to fetch user',
      details: process.env.NODE_ENV === 'development' ? {
        message: errorMessage,
        code: errorCode
      } : undefined
    }, { status: 500 });
  }
}
