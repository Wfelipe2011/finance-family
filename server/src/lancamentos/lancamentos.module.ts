import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lancamento } from '../entities/lancamento.entity';
import { JarvisFinanceDraft } from '../entities/jarvis-finance-draft.entity';
import { FamilyGroupsModule } from '../family/family-groups.module';
import {
  GroupJarvisDraftsController,
  GroupLancamentosController,
  LancamentosController,
} from './lancamentos.controller';
import { LancamentosService } from './lancamentos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lancamento, JarvisFinanceDraft]),
    FamilyGroupsModule,
  ],
  controllers: [
    LancamentosController,
    GroupLancamentosController,
    GroupJarvisDraftsController,
  ],
  providers: [LancamentosService],
  exports: [LancamentosService],
})
export class LancamentosModule {}
