import { Module, forwardRef } from '@nestjs/common';
import { IAConfigModule } from '../config/ia-config.module';
import { LancamentosModule } from '../lancamentos/lancamentos.module';
import { ChatModule } from '../chat/chat.module';
import { SkillsModule } from '../skills/skills.module';
import { AgentFactoryService } from './agent-factory.service';
import { AgentMemoryService } from './agent-memory.service';
import { AgentOrchestratorService } from './agent-orchestrator.service';
import { AgentToolFactoryService } from './agent-tool-factory.service';
import { AgentToolsService } from './agent-tools.service';
import { AudioExtractorAgentService } from './audio-extractor-agent.service';
import { ConsultorAgentService } from './consultor-agent.service';
import { ImageExtractorAgentService } from './image-extractor-agent.service';
import { OperadorAgentService } from './operador-agent.service';

@Module({
  imports: [
    IAConfigModule,
    LancamentosModule,
    SkillsModule,
    forwardRef(() => ChatModule),
  ],
  providers: [
    AgentFactoryService,
    AgentMemoryService,
    AgentToolFactoryService,
    AgentToolsService,
    AudioExtractorAgentService,
    ConsultorAgentService,
    ImageExtractorAgentService,
    OperadorAgentService,
    AgentOrchestratorService,
  ],
  exports: [AgentOrchestratorService],
})
export class AgentModule {}
