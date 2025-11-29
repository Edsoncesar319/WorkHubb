import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, createUser } from '@/lib/db/queries';

export async function GET() {
  try {
    console.log('Fetching all users...');
    const users = await getAllUsers();
    console.log(`Found ${users.length} users`);
    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    });
    
    const errorMessage = error?.message || 'Failed to fetch users';
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        message: error?.message,
        code: error?.code
      } : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: any = null;
  
  try {
    body = await request.json();
    console.log('Received user data:', {
      id: body?.id,
      name: body?.name,
      email: body?.email,
      type: body?.type,
      hasBio: !!body?.bio,
      hasStack: !!body?.stack,
    });
    
    // Validar campos obrigatórios
    if (!body?.id || !body?.name || !body?.email || !body?.type) {
      const missingFields = [];
      if (!body?.id) missingFields.push('id');
      if (!body?.name) missingFields.push('name');
      if (!body?.email) missingFields.push('email');
      if (!body?.type) missingFields.push('type');
      
      return NextResponse.json({ 
        error: `Campos obrigatórios faltando: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }

    // Validar tipo de usuário
    if (body.type !== 'professional' && body.type !== 'company') {
      return NextResponse.json({ 
        error: 'Tipo de usuário inválido. Deve ser "professional" ou "company"' 
      }, { status: 400 });
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({ 
        error: 'Formato de email inválido' 
      }, { status: 400 });
    }

    // Garantir que campos opcionais sejam null ao invés de undefined
    // createdAt não precisa ser passado pois tem defaultNow() no schema
    const userData: any = {
      id: String(body.id),
      name: String(body.name).trim(),
      email: String(body.email).trim().toLowerCase(),
      type: body.type,
      bio: body.bio ? String(body.bio).trim() : null,
      stack: body.stack ? String(body.stack).trim() : null,
      github: body.github ? String(body.github).trim() : null,
      linkedin: body.linkedin ? String(body.linkedin).trim() : null,
      company: body.company ? String(body.company).trim() : null,
      profilePhoto: body.profilePhoto ? String(body.profilePhoto).trim() : null,
    };

    console.log('Creating user with processed data:', {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      type: userData.type,
    });

    const user = await createUser(userData);
    console.log('User created successfully:', user.id);
    
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      errno: error?.errno,
      sql: error?.sql,
      stack: error?.stack,
      body: body
    });
    
    // Extrair o erro real se estiver aninhado
    const realError = error?.cause || error;
    const errorMsg = realError?.message || error?.message || '';
    const errorCode = realError?.code || error?.code;
    
    // Retornar mensagem de erro mais detalhada
    let errorMessage = 'Erro ao criar usuário';
    let statusCode = 500;
    
    if (errorCode === '23505' || errorMsg?.includes('duplicate key value')) {
      errorMessage = 'Este email já está cadastrado';
      statusCode = 409;
    } else if (errorCode === '42P01' || 
               errorMsg?.includes('does not exist') || 
               errorMsg?.includes('relation') ||
               errorMsg?.includes('Tabelas do banco') ||
               errorMsg?.includes('Failed query')) {
      errorMessage = process.env.VERCEL === '1'
        ? 'Tabelas do banco de dados não foram criadas em produção. Execute o SQL em scripts/create-postgres-tables.sql no console SQL do Postgres da Vercel.'
        : 'Tabelas do banco de dados não foram criadas. Execute: npm run db:sync:postgres';
      statusCode = 503;
      errorResponse.code = 'TABLES_NOT_EXIST';
      errorResponse.help = 'Execute scripts/create-postgres-tables.sql in Vercel Postgres SQL Editor';
    } else if (errorMsg?.includes('Failed to identify your database') || 
               errorMsg?.includes('A server error occurred') ||
               errorMsg?.includes('connection') ||
               errorMsg?.includes('ECONNREFUSED')) {
      errorMessage = 'Erro de conexão com o banco de dados. Verifique se o Postgres está configurado corretamente.';
      statusCode = 503;
    } else if (errorMsg?.includes('Database not available') || 
               errorMsg?.includes('Postgres não configurado')) {
      errorMessage = 'Banco de dados não está disponível. Verifique a configuração.';
      statusCode = 503;
    } else if (errorMsg?.includes('toISOString')) {
      errorMessage = 'Erro ao processar data. Tente novamente.';
      statusCode = 500;
    } else if (errorMsg) {
      errorMessage = String(errorMsg);
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error?.toString && typeof error.toString === 'function') {
      errorMessage = error.toString();
    }
    
    // Garantir que sempre retornamos um objeto válido
    const errorResponse: { error: string; code?: string; help?: string; details?: any } = { 
      error: errorMessage || 'Erro desconhecido ao criar usuário'
    };
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = {
        message: error?.message,
        code: error?.code,
        errno: error?.errno,
        sql: error?.sql,
        stack: error?.stack?.substring(0, 500) // Limitar tamanho do stack trace
      };
    }
    
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
