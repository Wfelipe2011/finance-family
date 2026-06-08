export type FamilyGroupMemberRole = "member" | "owner";

export interface FamilyGroupDTO {
  id: number;
  name: string;
  created_at: string;
}

export interface FamilyGroupMemberDTO {
  id: number;
  group_id: number;
  usuario_id: number;
  role: FamilyGroupMemberRole;
  displayName: string;
  avatarUrl?: string | null;
  joined_at: string;
}

export interface FamilyGroupSettingsDTO {
  id: number;
  group_id: number;
  jarvisAlwaysOn: boolean;
  jarvisAvatarAssetId?: number | null;
  updated_at: string;
}

export interface UpdateFamilyGroupSettingsDTO {
  jarvisAlwaysOn?: boolean;
  jarvisAvatarAssetId?: number | null;
}
