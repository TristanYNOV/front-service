import { Injectable } from '@angular/core';
import { AuthTokens } from '../../interfaces/auth.interface';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly accessKey = 'myVideo_access_token';
  private readonly refreshKey = 'myVideo_refresh_token';
  private readonly emailKey = 'myVideo_email_token';

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  setTokens(tokens: AuthTokens): void {
    if (!this.isBrowser()) return;

    window.localStorage.setItem(this.accessKey, tokens.accessToken);
    window.localStorage.setItem(this.refreshKey, tokens.refreshToken);
  }

  getTokens(): AuthTokens | null {
    if (!this.isBrowser()) return null;

    const accessToken = window.localStorage.getItem(this.accessKey);
    const refreshToken = window.localStorage.getItem(this.refreshKey);

    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  }

  clearTokens(): void {
    if (!this.isBrowser()) return;

    window.localStorage.removeItem(this.accessKey);
    window.localStorage.removeItem(this.refreshKey);
  }

  setEmailInLocalStorage(email: string) {
    if(!this.isBrowser()) return;

    window.localStorage.setItem(this.emailKey, JSON.stringify(email));
  }

  removeEmailInLocalStorage() {
    if(!this.isBrowser()) return;

    window.localStorage.removeItem(this.emailKey);
  }

  getEmailInLocalStorage() {
    if(!this.isBrowser()) return;

    return window.localStorage.getItem(this.emailKey);
  }
}
