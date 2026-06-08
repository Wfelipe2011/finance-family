import {
  BadRequestException,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { AuthenticatedRequest } from '../auth/request-user';
import { AvatarsService } from './avatars.service';

const allowedAvatarFile = (file: { mimetype: string }) =>
  file.mimetype === 'image/png' ||
  file.mimetype === 'image/jpeg' ||
  file.mimetype === 'image/webp';

const avatarInterceptor = FileInterceptor('file', {
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const valid = allowedAvatarFile(file);
    callback(valid ? null : new BadRequestException('Invalid file type'), valid);
  },
});

@Controller()
export class AvatarsController {
  constructor(private readonly avatarsService: AvatarsService) {}

  @Post('users/me/avatar')
  @UseInterceptors(avatarInterceptor)
  uploadUserAvatar(
    @Request() req: AuthenticatedRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.avatarsService.uploadUserAvatar(req.user.userId, file);
  }

  @Post('groups/:groupId/jarvis/avatar')
  @UseInterceptors(avatarInterceptor)
  uploadJarvisAvatar(
    @Request() req: AuthenticatedRequest,
    @Param('groupId', ParseIntPipe) groupId: number,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.avatarsService.uploadJarvisAvatar(req.user.userId, groupId, file);
  }
}
