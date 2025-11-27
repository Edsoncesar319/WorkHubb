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
    
    // Durante o build na Vercel, usar banco em memória
    if (process.env.VERCEL || process.env.NEXT_PHASE === 'phase-production-build') {
      sqliteInstance = new Database(':memory:');
    } else {
      // Em desenvolvimento/local, usar arquivo SQLite
      sqliteInstance = new Database('./lib/db/workhubb.db');
    }
    
    return sqliteInstance;
  } catch (error) {
    // Se better-sqlite3 não estiver disponível (durante build), criar um mock
    console.warn('better-sqlite3 not available, database operations will fail at runtime');
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
