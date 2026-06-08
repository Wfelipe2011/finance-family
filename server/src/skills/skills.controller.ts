import { Controller, Get } from '@nestjs/common';
import { JarvisSkillRegistryService } from './jarvis-skill-registry.service';

@Controller('api/skills')
export class SkillsController {
  constructor(private readonly registry: JarvisSkillRegistryService) {}

  @Get()
  list() {
    return this.registry.list();
  }
}
