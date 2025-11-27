import * as schema from './schema';

// Detectar ambiente
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_ENV;
// A Vercel pode usar diferentes variáveis para Postgres
const hasPostgresUrl = !!(
  process.env.POSTGRES_URL || 
  process.env.POSTGRES_URL_NON_POOLING || 
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL
);

// Lazy loading do banco de dados
let dbInstance: any = null;
let initPromise: Promise<any> | null = null;

async function initDb() {
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
        console.log('Postgres environment variables:', {
          hasPostgresUrl: !!process.env.POSTGRES_URL,
          hasPostgresUrlNonPooling: !!process.env.POSTGRES_URL_NON_POOLING,
          hasPostgresPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
        });
        
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
        postgresUrl: hasPostgresUrl ? 'configured' : 'not set',
        envVars: {
          VERCEL: process.env.VERCEL,
          VERCEL_ENV: process.env.VERCEL_ENV,
          POSTGRES_URL: process.env.POSTGRES_URL ? 'set' : 'not set',
          POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? 'set' : 'not set',
          POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? 'set' : 'not set',
          DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set',
        }
      });
      
      if (isVercel && !hasPostgresUrl) {
        const errorMsg = 
          'Vercel Postgres não configurado.\n\n' +
          'Para configurar:\n' +
          '1. Acesse https://vercel.com/dashboard\n' +
          '2. Vá em Storage > Create Database > Postgres\n' +
          '3. Crie o banco e conecte ao seu projeto\n' +
          '4. Execute o SQL em scripts/create-postgres-tables.sql\n\n' +
          'Veja DEPLOY_GUIDE.md para instruções detalhadas.';
        throw new Error(errorMsg);
      }
      
      throw error;
    }
  })();

  return initPromise;
}

// Função para garantir que o banco está inicializado
export async function ensureDbInitialized() {
  if (!dbInstance) {
    await initDb();
  }
  return dbInstance;
}

// Para SQLite, podemos inicializar de forma síncrona
function initDbSync() {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    const { drizzle } = require('drizzle-orm/better-sqlite3');
    const Database = require('better-sqlite3');
    const path = require('path');
    const fs = require('fs');
    
    const dbPath = './lib/db/workhubb.db';
    const absolutePath = path.resolve(process.cwd(), dbPath);
    
    const dbDir = path.dirname(absolutePath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    const sqliteInstance = new Database(absolutePath);
    dbInstance = drizzle(sqliteInstance, { schema });
    return dbInstance;
  } catch (error: any) {
    console.error('Error initializing SQLite synchronously:', error);
    throw error;
  }
}

// Exporta o banco de dados
// Para SQLite (desenvolvimento), inicializa de forma síncrona
// Para Postgres (produção), precisa ser inicializado de forma assíncrona
export const db = (() => {
  // Se for SQLite, inicializar agora
  if (!isVercel || !hasPostgresUrl) {
    try {
      return initDbSync();
    } catch (error) {
      console.error('Failed to initialize SQLite:', error);
      // Retornar um objeto proxy que vai tentar inicializar quando usado
    }
  }
  
  // Para Postgres ou se SQLite falhou, retornar um proxy
  return new Proxy({} as any, {
    get(target, prop) {
      if (dbInstance) {
        const value = (dbInstance as any)[prop];
        if (typeof value === 'function') {
          return value.bind(dbInstance);
        }
        return value;
      }
      
      // Se não temos instância, retornar uma função que inicializa e chama
      return async function(...args: any[]) {
        const db = await ensureDbInitialized();
        const method = (db as any)[prop];
        if (typeof method === 'function') {
          return method.apply(db, args);
        }
        return method;
      };
    }
  });
})();

// Exporta o schema
export * from './schema';
