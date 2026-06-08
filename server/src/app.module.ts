import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AvatarsModule } from './avatars/avatars.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { IAConfigModule } from './config/ia-config.module';
import { DatabaseModule } from './database/database.module';
import { FamilyGroupsModule } from './family/family-groups.module';
import { LancamentosModule } from './lancamentos/lancamentos.module';
import { QueueModule } from './queue/queue.module';
import { SkillsModule } from './skills/skills.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env'],
    }),
    DatabaseModule,
    QueueModule,
    UsersModule,
    AuthModule,
    FamilyGroupsModule,
    LancamentosModule,
    IAConfigModule,
    SkillsModule,
    AvatarsModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
