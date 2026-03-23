export interface AuthTokens {
  accessToken: string;
  // kept optional only for backward compatibility with legacy store code.
  refreshToken?: string;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  email: string;
  tokens: AuthTokens;
}
