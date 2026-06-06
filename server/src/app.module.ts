import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { IAConfigModule } from './config/ia-config.module';
import { DatabaseModule } from './database/database.module';
import { LancamentosModule } from './lancamentos/lancamentos.module';
import { QueueModule } from './queue/queue.module';
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
    LancamentosModule,
    IAConfigModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
