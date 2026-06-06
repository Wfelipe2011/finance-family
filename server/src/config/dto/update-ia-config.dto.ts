import { IsOptional, IsString, IsUrl, Length } from 'class-validator';

export class UpdateIAConfigDto {
  @IsOptional()
  @IsUrl({ require_tld: false })
  @Length(1, 255)
  baseUrl?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  apiKey?: string | null;
}
