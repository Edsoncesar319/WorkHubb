import { prisma } from './prisma';

export async function seedDatabase() {
  const existing = await prisma.user.findFirst();
  if (existing) {
    console.log('Database already seeded');
    return;
  }

  const initialUsers = [
    {
      id: 'company1',
      name: 'TechCorp',
      email: 'contato@techcorp.com',
      type: 'company',
      company: 'TechCorp',
      bio: 'Empresa líder em tecnologia',
    },
    {
      id: 'company2',
      name: 'StartupXYZ',
      email: 'contato@startupxyz.com',
      type: 'company',
      company: 'StartupXYZ',
      bio: 'Startup inovadora em desenvolvimento web',
    },
    {
      id: 'prof1',
      name: 'João Silva',
      email: 'joao@example.com',
      type: 'professional',
      stack: 'React, Node.js, TypeScript',
      bio: 'Desenvolvedor full stack',
    },
  ];

  for (const user of initialUsers) {
    await prisma.user.create({ data: user });
  }

  console.log('Database seeded successfully');
}
