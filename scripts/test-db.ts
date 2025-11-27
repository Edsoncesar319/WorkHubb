import { db } from '../lib/db';
import { users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function testDatabase() {
  console.log('🧪 Testando conexão com o banco de dados...\n');
  
  try {
    console.log('1. Testando acesso ao banco...');
    const result = await db.select().from(users).limit(1);
    console.log('✅ Banco de dados acessível!');
    console.log(`   Encontrados ${result.length} usuários na consulta de teste\n`);
    
    console.log('2. Testando inserção...');
    const testUser = {
      id: `test-${Date.now()}`,
      name: 'Test User',
      email: `test${Date.now()}@test.com`,
      type: 'professional' as const,
      bio: null,
      stack: null,
      github: null,
      linkedin: null,
      company: null,
      profilePhoto: null,
      createdAt: new Date().toISOString(),
    };
    
    const inserted = await db.insert(users).values(testUser).returning();
    console.log('✅ Usuário de teste inserido com sucesso!');
    console.log(`   ID: ${inserted[0].id}\n`);
    
    console.log('3. Testando leitura...');
    const readUser = await db.select().from(users).where(eq(users.id, testUser.id)).limit(1);
    console.log('✅ Usuário lido com sucesso!');
    console.log(`   Nome: ${readUser[0]?.name}\n`);
    
    console.log('4. Limpando teste...');
    await db.delete(users).where(eq(users.id, testUser.id));
    console.log('✅ Usuário de teste removido!\n');
    
    console.log('🎉 Todos os testes passaram! O banco de dados está funcionando corretamente.');
  } catch (error: any) {
    console.error('❌ Erro ao testar banco de dados:');
    console.error('   Mensagem:', error?.message);
    console.error('   Código:', error?.code);
    console.error('   Stack:', error?.stack);
    process.exit(1);
  }
}

testDatabase();

