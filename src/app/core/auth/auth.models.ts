export type AuthStatus = 'anonymous' | 'restoring' | 'authenticated';

export interface UserPublicDto {
  id: string;
  pseudo: string;
  email: string;
}

export interface AuthState {
  status: AuthStatus;
  user: UserPublicDto | null;
  accessToken: string | null;
  isRefreshing: boolean;
  bootstrapped: boolean;
  error: string | null;
}

export interface RegisterRequest {
  email: string;
  password: string;
  pseudo?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshResponse {
  accessToken: string;
}
