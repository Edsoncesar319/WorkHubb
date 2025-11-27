import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, createUser } from '@/lib/db/queries';

export async function GET() {
  try {
    const users = await getAllUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar campos obrigatórios
    if (!body.id || !body.name || !body.email || !body.type) {
      return NextResponse.json({ 
        error: 'Missing required fields: id, name, email, type' 
      }, { status: 400 });
    }

    // Validar tipo de usuário
    if (body.type !== 'professional' && body.type !== 'company') {
      return NextResponse.json({ 
        error: 'Invalid user type. Must be "professional" or "company"' 
      }, { status: 400 });
    }

    // Garantir que campos opcionais sejam null ao invés de undefined
    const userData = {
      id: body.id,
      name: body.name,
      email: body.email,
      type: body.type,
      bio: body.bio || null,
      stack: body.stack || null,
      github: body.github || null,
      linkedin: body.linkedin || null,
      company: body.company || null,
      profilePhoto: body.profilePhoto || null,
      createdAt: body.createdAt || new Date().toISOString(),
    };

    const user = await createUser(userData);
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      body: body
    });
    
    // Retornar mensagem de erro mais detalhada
    let errorMessage = 'Failed to create user';
    let statusCode = 500;
    
    if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      errorMessage = 'Este email já está cadastrado';
      statusCode = 409;
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
        stack: error?.stack
      } : undefined
    }, { status: statusCode });
  }
}
