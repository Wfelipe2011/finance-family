import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { AvatarAsset } from './entities/avatar-asset.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { FamilyGroup } from './entities/family-group.entity';
import { FamilyGroupMembership } from './entities/family-group-membership.entity';
import { FamilyGroupSettings } from './entities/family-group-settings.entity';
import { IAConfig } from './entities/ia-config.entity';
import { JarvisFinanceDraft } from './entities/jarvis-finance-draft.entity';
import { Lancamento } from './entities/lancamento.entity';
import { Usuario } from './entities/usuario.entity';

type SeedUser = {
  nome: string;
  email: string;
  password: string;
};

const seedUsers: SeedUser[] = [
  {
    nome: 'Wilson',
    email: 'wfelipe2011@gmail.com',
    password: '661879',
  },
  {
    nome: 'Giulia',
    email: 'giu.souza29@gmail.com',
    password: '661879',
  },
];

async function seedUsersIntoDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to seed users');
  }

  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [
      Usuario,
      Lancamento,
      ChatMessage,
      IAConfig,
      FamilyGroup,
      FamilyGroupMembership,
      FamilyGroupSettings,
      AvatarAsset,
      JarvisFinanceDraft,
    ],
    synchronize: false,
  });

  await dataSource.initialize();

  try {
    const usersRepository = dataSource.getRepository(Usuario);

    for (const seedUser of seedUsers) {
      const password_hash = await bcrypt.hash(seedUser.password, 10);

      await usersRepository.upsert(
        {
          nome: seedUser.nome,
          email: seedUser.email,
          password_hash,
        },
        ['email'],
      );
    }

    console.log(`Seeded ${seedUsers.length} users`);
  } finally {
    await dataSource.destroy();
  }
}

void seedUsersIntoDatabase().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
