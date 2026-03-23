import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { runtimeEnvironment } from '../config/runtime-environment';
import { LoginRequest, RefreshResponse, RegisterRequest, UserPublicDto } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  login(payload: LoginRequest): Observable<string> {
    return this.http.post(runtimeEnvironment.authEndpoints.login, payload, {
      responseType: 'text',
      withCredentials: true,
    }).pipe(
      map(rawToken => this.normalizeJwtFromLogin(rawToken))
    );
  }

  register(payload: RegisterRequest): Observable<UserPublicDto> {
    return this.http.post<UserPublicDto>(runtimeEnvironment.authEndpoints.register, payload, {
      withCredentials: true,
    });
  }

  refresh(): Observable<RefreshResponse> {
    return this.http.post<RefreshResponse>(runtimeEnvironment.authEndpoints.refresh, {}, {
      withCredentials: true,
    });
  }

  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(runtimeEnvironment.authEndpoints.logout, {}, {
      withCredentials: true,
    });
  }

  me(): Observable<UserPublicDto> {
    return this.http.get<UserPublicDto>(runtimeEnvironment.authEndpoints.me, {
      withCredentials: true,
    });
  }

  /**
   * Robustesse de parsing: selon le backend/proxy, le login peut répondre
   * soit `"<jwt>"`, soit `{ "accessToken": "<jwt>" }`.
   */
  private normalizeJwtFromLogin(rawToken: string): string {
    const trimmed = rawToken.trim();

    try {
      const parsed = JSON.parse(trimmed) as unknown;

      if (typeof parsed === 'string') {
        return parsed;
      }

      if (typeof parsed === 'object' && parsed !== null && 'accessToken' in parsed) {
        const accessToken = (parsed as { accessToken?: unknown }).accessToken;
        if (typeof accessToken === 'string' && accessToken.trim().length > 0) {
          return accessToken;
        }
      }
    } catch {
      // Réponse déjà en texte brut: on garde la valeur telle quelle.
    }

    return trimmed;
  }
}
