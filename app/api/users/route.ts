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
    const userData = {
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
      createdAt: body.createdAt || new Date().toISOString(),
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
    
    // Retornar mensagem de erro mais detalhada
    let errorMessage = 'Erro ao criar usuário';
    let statusCode = 500;
    
    if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE' || error?.errno === 19) {
      errorMessage = 'Este email já está cadastrado';
      statusCode = 409;
    } else if (error?.message?.includes('UNIQUE constraint')) {
      errorMessage = 'Este email já está cadastrado';
      statusCode = 409;
    } else if (error?.message?.includes('Database not available')) {
      errorMessage = 'Banco de dados não está disponível. Verifique a configuração.';
      statusCode = 503;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (error?.toString) {
      errorMessage = error.toString();
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        message: error?.message,
        code: error?.code,
        errno: error?.errno,
        sql: error?.sql
      } : undefined
    }, { status: statusCode });
  }
}
