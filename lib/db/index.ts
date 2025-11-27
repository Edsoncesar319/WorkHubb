import * as schema from './schema';

// Detectar ambiente
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
const hasPostgresUrl = !!process.env.POSTGRES_URL;

// Lazy loading do banco de dados
let dbInstance: any = null;
let initPromise: Promise<any> | null = null;

function initDb() {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    if (dbInstance) {
      return dbInstance;
    }

    try {
      // Se estiver na Vercel e tiver POSTGRES_URL, usar Postgres
      if (isVercel && hasPostgresUrl) {
        console.log('Initializing Vercel Postgres database...');
        
        const { drizzle } = await import('drizzle-orm/vercel-postgres');
        const { sql } = await import('@vercel/postgres');
        
        // Importar schema PostgreSQL
        const pgSchema = await import('./schema-pg');
        
        dbInstance = drizzle(sql, { schema: pgSchema });
        console.log('Vercel Postgres initialized successfully');
        return dbInstance;
      }
      
      // Caso contrário, usar SQLite (desenvolvimento local)
      console.log('Initializing SQLite database...');
      
      const { drizzle } = await import('drizzle-orm/better-sqlite3');
      const Database = require('better-sqlite3');
      const path = require('path');
      const fs = require('fs');
      
      const dbPath = './lib/db/workhubb.db';
      const absolutePath = path.resolve(process.cwd(), dbPath);
      
      console.log('Database path:', absolutePath);
      
      // Verificar se o diretório existe
      const dbDir = path.dirname(absolutePath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      
      const sqliteInstance = new Database(absolutePath);
      dbInstance = drizzle(sqliteInstance, { schema });
      console.log('SQLite initialized successfully');
      return dbInstance;
    } catch (error: any) {
      console.error('Error initializing database:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        isVercel,
        hasPostgresUrl,
        postgresUrl: hasPostgresUrl ? 'configured' : 'not set'
      });
      
      if (isVercel && !hasPostgresUrl) {
        throw new Error(
          'Vercel Postgres não configurado. ' +
          'Por favor, crie um banco Postgres na Vercel e configure POSTGRES_URL. ' +
          'Veja DEPLOYMENT.md para instruções.'
        );
      }
      
      throw error;
    }
  })();

  return initPromise;
}

// Exporta o banco de dados com lazy loading
export const db = new Proxy({} as any, {
  get(target, prop) {
    // Inicializar o banco se ainda não foi inicializado
    if (!dbInstance) {
      // Iniciar inicialização (não esperar aqui, será esperado quando o método for chamado)
      initDb();
    }
    
    // Se já temos a instância, retornar diretamente
    if (dbInstance) {
      const value = (dbInstance as any)[prop];
      if (typeof value === 'function') {
        return value.bind(dbInstance);
      }
      return value;
    }
    
    // Caso contrário, retornar uma função que espera a inicialização
    return async (...args: any[]) => {
      const db = await initDb();
      const method = (db as any)[prop];
      if (typeof method === 'function') {
        return method.apply(db, args);
      }
      return method;
    };
  }
});

// Exporta o schema
export * from './schema';
