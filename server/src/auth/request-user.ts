export interface RequestUser {
  userId: number;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  user: RequestUser;
}
