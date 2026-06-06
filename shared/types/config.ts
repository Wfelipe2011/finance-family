export interface IAConfig {
  baseUrl: string | null;
  apiKey: string | null;
}

export interface UpdateIAConfigDTO {
  baseUrl?: string | null;
  apiKey?: string | null;
}
