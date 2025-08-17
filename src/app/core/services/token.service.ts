import { Injectable } from '@angular/core';
import { AuthTokens } from '../../interfaces/auth.interface';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private accessKey = 'access_token';
  private refreshKey = 'refresh_token';

  setTokens(tokens: AuthTokens): void {
    localStorage.setItem(this.accessKey, tokens.accessToken);
    localStorage.setItem(this.refreshKey, tokens.refreshToken);
  }

  getTokens(): AuthTokens | null {
    const accessToken = localStorage.getItem(this.accessKey);
    const refreshToken = localStorage.getItem(this.refreshKey);
    if (!accessToken || !refreshToken) {
      return null;
    }
    return { accessToken, refreshToken };
  }

  clearTokens(): void {
    localStorage.removeItem(this.accessKey);
    localStorage.removeItem(this.refreshKey);
  }
}
