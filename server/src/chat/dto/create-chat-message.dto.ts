import { IsOptional, IsString } from 'class-validator';

export class CreateChatMessageDto {
  @IsOptional()
  @IsString()
  content?: string;
}
