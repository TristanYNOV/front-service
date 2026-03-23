import { Injectable, inject } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';
import { AuthRequest, AuthResponse } from '../../interfaces/auth.interface';
import { AuthApiService } from '../auth/auth-api.service';

/**
 * Legacy adapter pour compatibilité NgRx historique.
 * Délègue aux routes réelles du auth-service documentées dans docs/API/Auth.
 */
@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly authApi = inject(AuthApiService);

  signIn(payload: AuthRequest): Observable<AuthResponse> {
    return this.authApi.login(payload).pipe(
      map(accessToken => ({
        email: payload.email,
        tokens: { accessToken },
      }))
    );
  }

  register(payload: AuthRequest): Observable<AuthResponse> {
    return this.authApi.register(payload).pipe(
      switchMap(() => this.signIn(payload))
    );
  }
}
