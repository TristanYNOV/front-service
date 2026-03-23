import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, map, Observable, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { AuthState, UserPublicDto } from './auth.models';

const initialState: AuthState = {
  status: 'anonymous',
  user: null,
  accessToken: null,
  isRefreshing: false,
  bootstrapped: false,
  error: null,
};

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  private readonly stateSignal = signal<AuthState>(initialState);
  private refreshInFlight$: Observable<string> | null = null;

  readonly state = this.stateSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.stateSignal().status === 'authenticated');
  readonly isRestoring = computed(() => this.stateSignal().status === 'restoring');
  readonly user = computed(() => this.stateSignal().user);
  readonly accessToken = computed(() => this.stateSignal().accessToken);

  /**
   * Bootstrap au démarrage : refresh via cookie HttpOnly puis /me si succès.
   * En cas d'échec, on reste anonyme sans bloquer les routes publiques.
   */
  restoreSession(): Observable<void> {
    this.patchState({ status: 'restoring', bootstrapped: false, error: null });

    return this.refreshAccessToken().pipe(
      switchMap(() => this.fetchCurrentUser()),
      map(() => void 0),
      catchError(() => {
        this.clearAuthState();
        return of(void 0);
      }),
      tap(() => this.patchState({ bootstrapped: true }))
    );
  }

  login(email: string, password: string): Observable<UserPublicDto> {
    this.patchState({ error: null });

    return this.authApi.login({ email, password }).pipe(
      tap(accessToken => {
        this.patchState({
          accessToken,
          status: 'authenticated',
        });
      }),
      switchMap(() => this.fetchCurrentUser()),
      tap(() => {
        void this.router.navigate(['/welcome']);
      })
    );
  }

  register(email: string, password: string): Observable<UserPublicDto> {
    // Contrat backend: /users ne retourne pas de token, on enchaîne avec login.
    return this.authApi.register({ email, password }).pipe(
      switchMap(() => this.login(email, password))
    );
  }

  logout(): Observable<void> {
    return this.authApi.logout().pipe(
      map(() => void 0),
      catchError(() => of(void 0)),
      tap(() => {
        this.clearAuthState();
        void this.router.navigate(['/']);
      })
    );
  }

  refreshAccessToken(): Observable<string> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    this.patchState({ isRefreshing: true });
    this.refreshInFlight$ = this.authApi.refresh().pipe(
      map(response => response.accessToken),
      tap(accessToken => {
        this.patchState({
          accessToken,
          status: 'authenticated',
          error: null,
        });
      }),
      catchError(error => {
        this.clearAuthState();
        return throwError(() => error);
      }),
      finalize(() => {
        this.patchState({ isRefreshing: false });
        this.refreshInFlight$ = null;
      }),
      shareReplay(1)
    );

    return this.refreshInFlight$;
  }

  clearAuthState(): void {
    this.stateSignal.set({
      ...initialState,
      bootstrapped: true,
    });
  }

  handleAuthFailureAndRedirect(): void {
    this.clearAuthState();
    void this.router.navigate(['/']);
  }

  private fetchCurrentUser(): Observable<UserPublicDto> {
    return this.authApi.me().pipe(
      tap(user => {
        this.patchState({
          user,
          status: 'authenticated',
          error: null,
        });
      })
    );
  }

  private patchState(patch: Partial<AuthState>): void {
    this.stateSignal.update(state => ({ ...state, ...patch }));
  }
}
