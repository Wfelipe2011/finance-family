import { Module, forwardRef } from '@nestjs/common';
import { IAConfigModule } from '../config/ia-config.module';
import { LancamentosModule } from '../lancamentos/lancamentos.module';
import { ChatModule } from '../chat/chat.module';
import { SkillsModule } from '../skills/skills.module';
import { AgentFactoryService } from './agent-factory.service';
import { AgentOrchestratorService } from './agent-orchestrator.service';
import { AudioExtractorAgentService } from './audio-extractor-agent.service';
import { ImageExtractorAgentService } from './image-extractor-agent.service';

@Module({
  imports: [
    IAConfigModule,
    LancamentosModule,
    SkillsModule,
    forwardRef(() => ChatModule),
  ],
  providers: [
    AgentFactoryService,
    AudioExtractorAgentService,
    ImageExtractorAgentService,
    AgentOrchestratorService,
  ],
  exports: [AgentOrchestratorService],
})
export class AgentModule { }
