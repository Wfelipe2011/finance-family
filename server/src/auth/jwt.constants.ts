import { ConfigService } from '@nestjs/config';

export const jwtSecret = (configService: ConfigService) =>
  configService.getOrThrow<string>('JWT_SECRET');

export const JWT_EXPIRES_IN = '7d';
