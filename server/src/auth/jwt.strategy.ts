import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { JwtPayload } from '@fin-ai/shared/auth';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { jwtSecret } from './jwt.constants';
import type { RequestUser } from './request-user';

function extractJwtFromQuery(request: Request) {
  const token = request.query?.token;
  return typeof token === 'string' ? token : null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        extractJwtFromQuery,
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret(configService),
    });
  }

  validate(payload: JwtPayload): RequestUser {
    return { userId: payload.sub, username: payload.username };
  }
}
