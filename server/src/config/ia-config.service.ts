import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type { IAConfig as IAConfigResponse } from '@fin-ai/shared/config';
import { Repository } from 'typeorm';
import { IAConfig } from '../entities/ia-config.entity';
import { UpdateIAConfigDto } from './dto/update-ia-config.dto';

@Injectable()
export class IAConfigService {
  constructor(
    @InjectRepository(IAConfig)
    private readonly configRepository: Repository<IAConfig>,
    private readonly env: ConfigService,
  ) {}

  async get(usuarioId: number): Promise<IAConfigResponse> {
    const config = await this.configRepository.findOne({
      where: { usuario_id: usuarioId },
    });

    if (!config) {
      return {
        baseUrl: this.env.get<string>('OPENAI_BASE_URL') ?? null,
        apiKey: this.mask(this.env.get<string>('OPENAI_API_KEY') ?? null),
      };
    }

    return {
      baseUrl: config.base_url,
      apiKey: this.mask(config.api_key),
    };
  }

  async getRaw(usuarioId: number) {
    const config = await this.configRepository.findOne({
      where: { usuario_id: usuarioId },
    });

    return {
      model: this.env.get<string>('OPENAI_MODEL') ?? 'gemma-4',
      baseUrl:
        config?.base_url ??
        this.env.get<string>('OPENAI_BASE_URL') ??
        'http://localhost:11434/v1',
      apiKey:
        config?.api_key ?? this.env.get<string>('OPENAI_API_KEY') ?? 'local',
    };
  }

  async update(
    usuarioId: number,
    dto: UpdateIAConfigDto,
  ): Promise<IAConfigResponse> {
    let config = await this.configRepository.findOne({
      where: { usuario_id: usuarioId },
    });

    if (!config) {
      config = this.configRepository.create({ usuario_id: usuarioId });
    }

    if (dto.baseUrl !== undefined) {
      config.base_url = dto.baseUrl;
    }
    if (dto.apiKey !== undefined) {
      config.api_key = dto.apiKey;
    }

    await this.configRepository.save(config);
    return this.get(usuarioId);
  }

  private mask(value: string | null) {
    if (!value) {
      return null;
    }
    if (value.length <= 4) {
      return value;
    }
    return `****${value.slice(-4)}`;
  }
}
