import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

// Lazy loading do banco de dados para evitar erros durante o build
let dbInstance: ReturnType<typeof drizzle> | null = null;
let sqliteInstance: any = null;

function getDatabase() {
  if (sqliteInstance) {
    return sqliteInstance;
  }

  try {
    const Database = require('better-sqlite3');
    const path = require('path');
    const fs = require('fs');
    
    // Durante o build na Vercel, usar banco em memória
    if (process.env.VERCEL || process.env.NEXT_PHASE === 'phase-production-build') {
      sqliteInstance = new Database(':memory:');
      console.log('Using in-memory database (build mode)');
    } else {
      // Em desenvolvimento/local, usar arquivo SQLite
      const dbPath = path.join(process.cwd(), 'lib', 'db', 'workhubb.db');
      console.log('Database path:', dbPath);
      
      // Verificar se o diretório existe
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      
      sqliteInstance = new Database(dbPath);
      console.log('Database initialized successfully');
    }
    
    return sqliteInstance;
  } catch (error: any) {
    // Se better-sqlite3 não estiver disponível (durante build), criar um mock
    console.error('Error initializing database:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    });
    return null;
  }
}

function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const sqlite = getDatabase();
  if (!sqlite) {
    // Retornar um mock que falhará em runtime mas permitirá o build
    return null as any;
  }

  dbInstance = drizzle(sqlite, { schema });
  return dbInstance;
}

// Exporta a função getDb ao invés de db direto para lazy loading
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const db = getDb();
    if (!db) {
      throw new Error('Database not available. Please configure a database for production (e.g., Vercel Postgres).');
    }
    return (db as any)[prop];
  }
});

// Exporta o schema para uso em outras partes da aplicação
export * from './schema';
