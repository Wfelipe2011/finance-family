import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateFamilyGroupSettingsDto {
  @IsOptional()
  @IsBoolean()
  jarvisAlwaysOn?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  jarvisAvatarAssetId?: number | null;
}
