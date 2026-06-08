import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  MessageEvent,
  Param,
  ParseIntPipe,
  Post,
  Request,
  Sse,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Observable } from 'rxjs';
import type { AuthenticatedRequest } from '../auth/request-user';
import { ChatService } from './chat.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { StreamService } from './stream.service';

const allowedFile = (file: { mimetype: string }) =>
  file.mimetype === 'audio/wav' || file.mimetype.startsWith('image/');

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly streamService: StreamService,
  ) {}

  @Post('message')
  @HttpCode(202)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        const valid = allowedFile(file);
        callback(
          valid ? null : new BadRequestException('Invalid file type'),
          valid,
        );
      },
    }),
  )
  submit(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateChatMessageDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.chatService.submit(req.user.userId, dto.content ?? '', file);
  }

  @Sse('stream/:userId')
  stream(
    @Request() req: AuthenticatedRequest,
    @Param('userId', ParseIntPipe) userId: number,
  ): Observable<MessageEvent> {
    if (req.user.userId !== userId) {
      throw new ForbiddenException();
    }
    return this.streamService.stream(userId);
  }

}

@Controller('groups/:groupId/chat')
export class GroupChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly streamService: StreamService,
  ) {}

  @Get('messages')
  history(
    @Request() req: AuthenticatedRequest,
    @Param('groupId', ParseIntPipe) groupId: number,
  ) {
    return this.chatService.history(req.user.userId, groupId);
  }

  @Post('messages')
  @HttpCode(202)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        const valid = allowedFile(file);
        callback(
          valid ? null : new BadRequestException('Invalid file type'),
          valid,
        );
      },
    }),
  )
  submitGroup(
    @Request() req: AuthenticatedRequest,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: CreateChatMessageDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.chatService.submitGroup(
      req.user.userId,
      groupId,
      dto.content ?? '',
      file,
    );
  }

  @Sse('stream')
  async groupStream(
    @Request() req: AuthenticatedRequest,
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<Observable<MessageEvent>> {
    await this.chatService.history(req.user.userId, groupId);
    return this.streamService.streamGroup(groupId);
  }
}
