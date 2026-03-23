import { Injectable } from '@angular/core';
import { AuthTokens } from '../../interfaces/auth.interface';

/**
 * Legacy service conservé pour compatibilité interne.
 * Les tokens sont maintenant uniquement en mémoire (jamais en storage persistant).
 */
@Injectable({ providedIn: 'root' })
export class TokenService {
  private tokens: AuthTokens | null = null;
  private email: string | null = null;

  setTokens(tokens: AuthTokens): void {
    this.tokens = tokens;
  }

  getTokens(): AuthTokens | null {
    return this.tokens;
  }

  clearTokens(): void {
    this.tokens = null;
  }

  setEmailInLocalStorage(email: string): void {
    this.email = email;
  }

  removeEmailInLocalStorage(): void {
    this.email = null;
  }

  getEmailInLocalStorage(): string | null {
    return this.email;
  }
}
