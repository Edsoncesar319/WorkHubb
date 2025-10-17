import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

// Cria a instância do banco de dados SQLite
const sqlite = new Database('./lib/db/workhubb.db');

// Cria a instância do Drizzle ORM
export const db = drizzle(sqlite, { schema });

// Exporta o schema para uso em outras partes da aplicação
export * from './schema';
