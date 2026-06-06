export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface JwtPayload {
  sub: number;
  username: string;
}

export interface UserProfile {
  userId: number;
  username: string;
}
