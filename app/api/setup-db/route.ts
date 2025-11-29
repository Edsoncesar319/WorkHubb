import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { readFileSync } from 'fs';
import path from 'path';

/**
 * Endpoint para criar as tabelas do banco de dados em produção
 * Acesse: /api/setup-db (apenas em produção)
 * 
 * ⚠️ ATENÇÃO: Este endpoint deve ser protegido em produção!
 * Adicione autenticação antes de usar em produção real.
 */
export async function POST() {
  // Apenas permitir em produção ou com variável de ambiente específica
  const isAllowed = process.env.VERCEL === '1' || process.env.ALLOW_DB_SETUP === '1';
  
  if (!isAllowed) {
    return NextResponse.json({ 
      error: 'Este endpoint só está disponível em produção ou com ALLOW_DB_SETUP=1' 
    }, { status: 403 });
  }

  try {
    const sqlFilePath = path.resolve(process.cwd(), 'scripts/create-postgres-tables.sql');
    const fileContent = readFileSync(sqlFilePath, 'utf-8');
    
    // Remover comentários e dividir em statements
    const sanitizedContent = fileContent
      .split(/\r?\n/)
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n');

    const statements = sanitizedContent
      .split(/;\s*(?:\r?\n|$)/)
      .map((statement) => statement.trim())
      .filter(Boolean);

    const results = [];
    for (const statement of statements) {
      try {
        await sql.query(statement);
        results.push({ statement: statement.substring(0, 50) + '...', status: 'success' });
      } catch (error: any) {
        // Ignorar erros de "already exists"
        if (error?.message?.includes('already exists') || error?.code === '42P07') {
          results.push({ statement: statement.substring(0, 50) + '...', status: 'skipped (already exists)' });
        } else {
          results.push({ statement: statement.substring(0, 50) + '...', status: 'error', error: error?.message });
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Executados ${statements.length} statements`,
      results 
    });
  } catch (error: any) {
    console.error('Error setting up database:', error);
    return NextResponse.json({ 
      error: error?.message || 'Erro ao configurar banco de dados',
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 });
  }
}

