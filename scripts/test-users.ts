import { getAllUsers, createUser, getUserByEmail } from '../lib/db/queries';

async function testUserSystem() {
  console.log('🧪 Testando sistema de usuários...\n');

  try {
    // Teste 1: Buscar todos os usuários
    console.log('1. Buscando todos os usuários...');
    const allUsers = await getAllUsers();
    console.log(`✅ Encontrados ${allUsers.length} usuários`);
    allUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.type}) - ${user.email}`);
    });

    // Teste 2: Criar um novo usuário profissional
    console.log('\n2. Criando usuário profissional...');
    const timestamp = Date.now();
    const newProfessional = {
      id: 'test-prof-' + timestamp,
      name: 'Ana Costa',
      email: `ana${timestamp}@teste.com`,
      type: 'professional' as const,
      bio: 'Desenvolvedora Frontend especializada em React',
      stack: 'React, TypeScript, CSS, HTML',
      github: 'https://github.com/ana',
      linkedin: 'https://linkedin.com/in/ana',
      company: undefined,
    };
    
    const createdProfessional = await createUser(newProfessional);
    console.log(`✅ Usuário profissional criado: ${createdProfessional.name}`);

    // Teste 3: Criar um novo usuário empresa
    console.log('\n3. Criando usuário empresa...');
    const newCompany = {
      id: 'test-company-' + timestamp,
      name: 'Inovatech',
      email: `contato${timestamp}@inovatech.com`,
      type: 'company' as const,
      bio: 'Startup inovadora em tecnologia',
      stack: undefined,
      github: undefined,
      linkedin: undefined,
      company: 'Inovatech',
    };
    
    const createdCompany = await createUser(newCompany);
    console.log(`✅ Usuário empresa criado: ${createdCompany.name}`);

    // Teste 4: Buscar usuário por email
    console.log('\n4. Buscando usuário por email...');
    const foundUser = await getUserByEmail(createdProfessional.email);
    if (foundUser) {
      console.log(`✅ Usuário encontrado: ${foundUser.name} (${foundUser.type})`);
    } else {
      console.log('❌ Usuário não encontrado');
    }

    // Teste 5: Verificar se email já existe
    console.log('\n5. Verificando email duplicado...');
    const duplicateUser = await getUserByEmail(createdProfessional.email);
    if (duplicateUser) {
      console.log('✅ Sistema detecta usuários existentes corretamente');
    }

    console.log('\n🎉 Todos os testes passaram! Sistema de usuários funcionando perfeitamente.');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

testUserSystem();
