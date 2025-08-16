import { Injectable } from '@angular/core';
import { AuthTokens } from '../../interfaces/auth.interface';

/**
 * Service de gestion des tokens JWT dans le navigateur.
 * Utilise localStorage pour persister les tokens entre les sessions.
 */
@Injectable({ providedIn: 'root' })
export class TokenService {
  private accessKey = 'access_token';
  private refreshKey = 'refresh_token';

  /** Sauvegarde les tokens dans le localStorage */
  setTokens(tokens: AuthTokens): void {
    localStorage.setItem(this.accessKey, tokens.accessToken);
    localStorage.setItem(this.refreshKey, tokens.refreshToken);
  }

  /** Récupère les tokens depuis le localStorage */
  getTokens(): AuthTokens | null {
    const accessToken = localStorage.getItem(this.accessKey);
    const refreshToken = localStorage.getItem(this.refreshKey);
    if (!accessToken || !refreshToken) {
      return null;
    }
    return { accessToken, refreshToken };
  }

  /** Supprime les tokens du localStorage */
  clearTokens(): void {
    localStorage.removeItem(this.accessKey);
    localStorage.removeItem(this.refreshKey);
  }
}
