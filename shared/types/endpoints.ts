import type { AvatarUploadResponse } from "./avatar";
import type { ChatJobResponse, ChatMessage, SSEEvent } from "./chat";
import type { IAConfig, UpdateIAConfigDTO } from "./config";
import type {
  FamilyGroupDTO,
  FamilyGroupSettingsDTO,
  UpdateFamilyGroupSettingsDTO,
} from "./group";
import type {
  CreateLancamentoDTO,
  LancamentoDTO,
  LancamentoFilterDTO,
  UpdateLancamentoDTO,
} from "./lancamento";
import type { JarvisSkillDTO } from "./skill";
import type { LoginRequest, LoginResponse, UserProfile } from "./auth";

/**
 * POST /auth/login
 * Request: LoginRequest
 * Response: LoginResponse
 * Status: 200 OK, 401 Unauthorized
 */
export type AuthLoginEndpoint = {
  method: "POST";
  path: "/auth/login";
  request: LoginRequest;
  response: LoginResponse;
};

/**
 * GET /auth/profile
 * Request: none
 * Response: UserProfile
 * Status: 200 OK, 401 Unauthorized
 */
export type AuthMeEndpoint = {
  method: "GET";
  path: "/auth/profile";
  response: UserProfile;
};

/**
 * GET /lancamentos
 * Request: LancamentoFilterDTO as query parameters
 * Response: LancamentoDTO[]
 * Status: 200 OK, 401 Unauthorized
 */
export type ListLancamentosEndpoint = {
  method: "GET";
  path: "/lancamentos";
  request: LancamentoFilterDTO;
  response: LancamentoDTO[];
};

/**
 * POST /lancamentos
 * Request: CreateLancamentoDTO
 * Response: LancamentoDTO
 * Status: 201 Created, 400 Bad Request, 401 Unauthorized
 */
export type CreateLancamentoEndpoint = {
  method: "POST";
  path: "/lancamentos";
  request: CreateLancamentoDTO;
  response: LancamentoDTO;
};

/**
 * PUT /lancamentos/:id
 * Request: UpdateLancamentoDTO
 * Response: LancamentoDTO
 * Status: 200 OK, 400 Bad Request, 401 Unauthorized, 404 Not Found
 */
export type UpdateLancamentoEndpoint = {
  method: "PUT";
  path: "/lancamentos/:id";
  request: UpdateLancamentoDTO;
  response: LancamentoDTO;
};

/**
 * DELETE /lancamentos/:id
 * Request: none
 * Response: void
 * Status: 204 No Content, 401 Unauthorized, 404 Not Found
 */
export type DeleteLancamentoEndpoint = {
  method: "DELETE";
  path: "/lancamentos/:id";
  response: void;
};

/**
 * GET /lancamentos/export
 * Request: LancamentoFilterDTO as query parameters
 * Response: text/csv attachment
 * Status: 200 OK, 401 Unauthorized
 */
export type ExportLancamentosEndpoint = {
  method: "GET";
  path: "/lancamentos/export";
  request: LancamentoFilterDTO;
  response: string;
};

/**
 * POST /chat/message
 * Request: multipart/form-data with content and optional audio/image attachment
 * Response: ChatJobResponse
 * Status: 202 Accepted, 400 Bad Request, 401 Unauthorized
 */
export type CreateChatMessageEndpoint = {
  method: "POST";
  path: "/chat/message";
  request: FormData;
  response: ChatJobResponse;
};

/**
 * GET /chat/stream/:userId
 * Request: native EventSource connection
 * Response: SSEEvent stream
 * Status: 200 OK, 401 Unauthorized
 */
export type ChatStreamEndpoint = {
  method: "GET";
  path: "/chat/stream/:userId";
  response: SSEEvent;
};

/**
 * GET /groups
 * Request: none
 * Response: FamilyGroupDTO[]
 * Status: 200 OK, 401 Unauthorized
 */
export type ListFamilyGroupsEndpoint = {
  method: "GET";
  path: "/groups";
  response: FamilyGroupDTO[];
};

/**
 * GET /groups/:groupId/chat/messages
 * Request: none
 * Response: ChatMessage[]
 * Status: 200 OK, 401 Unauthorized, 403 Forbidden
 */
export type GroupChatHistoryEndpoint = {
  method: "GET";
  path: "/groups/:groupId/chat/messages";
  response: ChatMessage[];
};

/**
 * POST /groups/:groupId/chat/messages
 * Request: multipart/form-data with content and optional audio/image attachment
 * Response: ChatJobResponse
 * Status: 202 Accepted, 400 Bad Request, 401 Unauthorized, 403 Forbidden
 */
export type CreateGroupChatMessageEndpoint = {
  method: "POST";
  path: "/groups/:groupId/chat/messages";
  request: FormData;
  response: ChatJobResponse;
};

/**
 * GET /groups/:groupId/chat/stream
 * Request: native EventSource connection
 * Response: SSEEvent stream
 * Status: 200 OK, 401 Unauthorized, 403 Forbidden
 */
export type GroupChatStreamEndpoint = {
  method: "GET";
  path: "/groups/:groupId/chat/stream";
  response: SSEEvent;
};

/**
 * GET /api/skills
 * Request: none
 * Response: JarvisSkillDTO[]
 * Status: 200 OK, 401 Unauthorized
 */
export type ListJarvisSkillsEndpoint = {
  method: "GET";
  path: "/api/skills";
  response: JarvisSkillDTO[];
};

/**
 * GET /groups/:groupId/settings
 * Request: none
 * Response: FamilyGroupSettingsDTO
 * Status: 200 OK, 401 Unauthorized, 403 Forbidden
 */
export type GetFamilyGroupSettingsEndpoint = {
  method: "GET";
  path: "/groups/:groupId/settings";
  response: FamilyGroupSettingsDTO;
};

/**
 * PUT /groups/:groupId/settings
 * Request: UpdateFamilyGroupSettingsDTO
 * Response: FamilyGroupSettingsDTO
 * Status: 200 OK, 400 Bad Request, 401 Unauthorized, 403 Forbidden
 */
export type UpdateFamilyGroupSettingsEndpoint = {
  method: "PUT";
  path: "/groups/:groupId/settings";
  request: UpdateFamilyGroupSettingsDTO;
  response: FamilyGroupSettingsDTO;
};

/**
 * POST /users/me/avatar
 * Request: multipart/form-data with image file
 * Response: AvatarUploadResponse
 * Status: 201 Created, 400 Bad Request, 401 Unauthorized
 */
export type UploadUserAvatarEndpoint = {
  method: "POST";
  path: "/users/me/avatar";
  request: FormData;
  response: AvatarUploadResponse;
};

/**
 * POST /groups/:groupId/jarvis/avatar
 * Request: multipart/form-data with image file
 * Response: AvatarUploadResponse
 * Status: 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden
 */
export type UploadJarvisAvatarEndpoint = {
  method: "POST";
  path: "/groups/:groupId/jarvis/avatar";
  request: FormData;
  response: AvatarUploadResponse;
};

/**
 * GET /config/ia
 * Request: none
 * Response: IAConfig
 * Status: 200 OK, 401 Unauthorized
 */
export type GetIAConfigEndpoint = {
  method: "GET";
  path: "/config/ia";
  response: IAConfig;
};

/**
 * PUT /config/ia
 * Request: UpdateIAConfigDTO
 * Response: IAConfig
 * Status: 200 OK, 400 Bad Request, 401 Unauthorized
 */
export type UpdateIAConfigEndpoint = {
  method: "PUT";
  path: "/config/ia";
  request: UpdateIAConfigDTO;
  response: IAConfig;
};

export type FinAiEndpoint =
  | AuthLoginEndpoint
  | AuthMeEndpoint
  | ListLancamentosEndpoint
  | CreateLancamentoEndpoint
  | UpdateLancamentoEndpoint
  | DeleteLancamentoEndpoint
  | ExportLancamentosEndpoint
  | CreateChatMessageEndpoint
  | ChatStreamEndpoint
  | ListFamilyGroupsEndpoint
  | GroupChatHistoryEndpoint
  | CreateGroupChatMessageEndpoint
  | GroupChatStreamEndpoint
  | ListJarvisSkillsEndpoint
  | GetFamilyGroupSettingsEndpoint
  | UpdateFamilyGroupSettingsEndpoint
  | UploadUserAvatarEndpoint
  | UploadJarvisAvatarEndpoint
  | GetIAConfigEndpoint
  | UpdateIAConfigEndpoint;
