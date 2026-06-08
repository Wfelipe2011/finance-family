import { Module } from '@nestjs/common';
import { SkillsController } from './skills.controller';
import { JarvisSkillRegistryService } from './jarvis-skill-registry.service';

@Module({
  controllers: [SkillsController],
  providers: [JarvisSkillRegistryService],
  exports: [JarvisSkillRegistryService],
})
export class SkillsModule {}
