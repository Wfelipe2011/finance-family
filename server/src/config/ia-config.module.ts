import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IAConfig } from '../entities/ia-config.entity';
import { IAConfigController } from './ia-config.controller';
import { IAConfigService } from './ia-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([IAConfig])],
  controllers: [IAConfigController],
  providers: [IAConfigService],
  exports: [IAConfigService],
})
export class IAConfigModule {}
