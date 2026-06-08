export type JarvisSkillId = "finance_crud" | "finance_query" | "finance_report";

export interface JarvisSkillDTO {
  id: JarvisSkillId | string;
  displayName: string;
  description: string;
  enabled: boolean;
}
