import { db } from './index';
import { users, jobs, applications } from './schema';
import { eq } from 'drizzle-orm';

export async function seedDatabase() {
  try {
    // Verificar se já existem dados
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log('Database already seeded');
      return;
    }

    // Inserir usuários iniciais
    const initialUsers = [
      {
        id: 'company1',
        name: 'TechCorp',
        email: 'contato@techcorp.com',
        type: 'company' as const,
        company: 'TechCorp',
        bio: 'Empresa líder em tecnologia',
      },
      {
        id: 'company2',
        name: 'StartupXYZ',
        email: 'contato@startupxyz.com',
        type: 'company' as const,
        company: 'StartupXYZ',
        bio: 'Startup inovadora em desenvolvimento web',
      },
      {
        id: 'company3',
        name: 'DataTech Solutions',
        email: 'contato@datatech.com',
        type: 'company' as const,
        company: 'DataTech Solutions',
        bio: 'Soluções em dados e analytics',
      },
      {
        id: 'user1',
        name: 'João Silva',
        email: 'joao@email.com',
        type: 'professional' as const,
        bio: 'Desenvolvedor Full Stack com 5 anos de experiência',
        stack: 'React, Node.js, TypeScript, PostgreSQL',
        github: 'https://github.com/joaosilva',
        linkedin: 'https://linkedin.com/in/joaosilva',
      },
    ];

    await db.insert(users).values(initialUsers);

    // Inserir vagas iniciais
    const initialJobs = [
      {
        id: '1',
        title: 'Senior Full Stack Developer',
        company: 'TechCorp',
        location: 'São Paulo, SP',
        remote: true,
        salary: 'R$ 12.000 - R$ 18.000',
        description: 'Estamos procurando um desenvolvedor full stack experiente para liderar projetos inovadores.',
        requirements: JSON.stringify(['React', 'Node.js', 'TypeScript', 'PostgreSQL', '5+ anos de experiência']),
        authorId: 'company1',
      },
      {
        id: '2',
        title: 'Frontend Developer React',
        company: 'StartupXYZ',
        location: 'Remoto',
        remote: true,
        salary: 'R$ 8.000 - R$ 12.000',
        description: 'Junte-se à nossa equipe para criar interfaces incríveis e responsivas.',
        requirements: JSON.stringify(['React', 'Next.js', 'Tailwind CSS', 'Git', '3+ anos de experiência']),
        authorId: 'company2',
      },
      {
        id: '3',
        title: 'Backend Developer Python',
        company: 'DataTech Solutions',
        location: 'Rio de Janeiro, RJ',
        remote: false,
        salary: 'R$ 10.000 - R$ 15.000',
        description: 'Desenvolva APIs robustas e escaláveis para nossos produtos de dados.',
        requirements: JSON.stringify(['Python', 'Django/Flask', 'PostgreSQL', 'Docker', 'AWS']),
        authorId: 'company3',
      },
    ];

    await db.insert(jobs).values(initialJobs);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
