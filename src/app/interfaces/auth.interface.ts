export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  email: string;
  tokens: AuthTokens;
}
