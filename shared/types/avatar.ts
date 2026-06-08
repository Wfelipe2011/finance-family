export type AvatarOwnerType = "user" | "agent";

export interface AvatarAssetDTO {
  id: number;
  ownerType: AvatarOwnerType;
  ownerId: string | number;
  group_id?: number | null;
  publicUrl: string;
  mimeType: string;
  size: number;
  created_at: string;
}

export interface AvatarUploadResponse {
  avatar: AvatarAssetDTO;
}
