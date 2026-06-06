import {
  Controller,
  Get,
  HttpCode,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import type { UserProfile } from '@fin-ai/shared/auth';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { Public } from './public.decorator';
import type { AuthenticatedRequest } from './request-user';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(200)
  login(@Request() req: AuthenticatedRequest) {
    return this.authService.login({
      id: req.user.userId ?? (req.user as unknown as { id: number }).id,
      email:
        req.user.username ?? (req.user as unknown as { email: string }).email,
    });
  }

  @Get(['profile', 'me'])
  profile(@Request() req: AuthenticatedRequest): UserProfile {
    return req.user;
  }
}
