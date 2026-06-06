import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload, LoginResponse } from '@fin-ai/shared/auth';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException();
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException();
    }

    return this.usersService.toSafeUser(user);
  }

  async login(user: { id: number; email: string }): Promise<LoginResponse> {
    const payload: JwtPayload = { sub: user.id, username: user.email };
    return { access_token: await this.jwtService.signAsync(payload) };
  }
}
