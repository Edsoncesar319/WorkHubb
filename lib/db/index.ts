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
      // Usar caminho relativo que será resolvido pelo better-sqlite3
      const dbPath = './lib/db/workhubb.db';
      const absolutePath = path.resolve(process.cwd(), dbPath);
      
      console.log('Initializing database...');
      console.log('Relative path:', dbPath);
      console.log('Absolute path:', absolutePath);
      console.log('Current working directory:', process.cwd());
      
      // Verificar se o diretório existe
      const dbDir = path.dirname(absolutePath);
      if (!fs.existsSync(dbDir)) {
        console.log('Creating database directory:', dbDir);
        fs.mkdirSync(dbDir, { recursive: true });
      }
      
      // Verificar se o arquivo existe
      const dbExists = fs.existsSync(absolutePath);
      console.log('Database file exists:', dbExists);
      
      try {
        // Usar caminho absoluto para garantir que funcione
        sqliteInstance = new Database(absolutePath);
        console.log('Database initialized successfully at:', absolutePath);
        
        // Testar uma query simples para garantir que funciona
        const testResult = sqliteInstance.prepare('SELECT 1 as test').get();
        console.log('Database connection test passed:', testResult);
      } catch (dbError: any) {
        console.error('Error creating database instance:', dbError);
        console.error('Database error details:', {
          message: dbError?.message,
          code: dbError?.code,
          errno: dbError?.errno,
          path: absolutePath
        });
        throw dbError;
      }
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

  try {
    const sqlite = getDatabase();
    if (!sqlite) {
      console.error('SQLite instance is null');
      throw new Error('Database not available. SQLite instance could not be created.');
    }

    dbInstance = drizzle(sqlite, { schema });
    console.log('Drizzle instance created successfully');
    return dbInstance;
  } catch (error: any) {
    console.error('Error creating Drizzle instance:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    });
    throw error;
  }
}

// Exporta a função getDb ao invés de db direto para lazy loading
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    try {
      const db = getDb();
      if (!db) {
        throw new Error('Database not available. Please configure a database for production (e.g., Vercel Postgres).');
      }
      return (db as any)[prop];
    } catch (error: any) {
      console.error('Error accessing database property:', prop, error);
      throw error;
    }
  }
});

// Exporta o schema para uso em outras partes da aplicação
export * from './schema';
