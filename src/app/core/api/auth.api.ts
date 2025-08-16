import { Injectable } from '@angular/core';
import { AuthRequest, AuthResponse } from '../../interfaces/auth.interface';
import { Observable, of, throwError, delay } from 'rxjs';

/**
 * Service simulant les appels au micro-service d'authentification.
 * Retourne un utilisateur avec des tokens JWT mockés.
 */
@Injectable({ providedIn: 'root' })
export class AuthApi {
  signIn(payload: AuthRequest): Observable<AuthResponse> {
    return this.mockRequest(payload);
  }

  register(payload: AuthRequest): Observable<AuthResponse> {
    return this.mockRequest(payload);
  }

  /**
   * Simule un appel HTTP en renvoyant un observable différé.
   * Retourne une erreur si l'email contient "error".
   */
  private mockRequest(payload: AuthRequest): Observable<AuthResponse> {
    if (payload.email.includes('error')) {
      return throwError(() => new Error('Authentication failed')).pipe(delay(500));
    }

    const response: AuthResponse = {
      email: payload.email,
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      },
    };

    return of(response).pipe(delay(500));
  }
}
