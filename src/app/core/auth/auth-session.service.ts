import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { catchError, defer, finalize, map, Observable, of, shareReplay, Subject, switchMap, takeUntil, tap, throwError } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { AuthState, UserPublicDto } from './auth.models';
import { SequencerPanelService } from '../service/sequencer-panel.service';
import { SequencerRuntimeService } from '../service/sequencer-runtime.service';
import { VideoService } from '../services/video.service';
import { resetTimeline } from '../../store/Timeline/timeline.actions';
import { analysisStoreResetWorkspaceState } from '../../store/AnalysisStore/analysis-store.actions';

const initialState: AuthState = {
  status: 'anonymous', user: null, accessToken: null,
  isRefreshing: false, bootstrapped: false, error: null,
};

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly sequencerPanelService = inject(SequencerPanelService);
  private readonly sequencerRuntimeService = inject(SequencerRuntimeService);
  private readonly videoService = inject(VideoService);
  private readonly stateSignal = signal<AuthState>(initialState);
  private readonly sessionChanged$ = new Subject<void>();
  private refreshInFlight$: Observable<string> | null = null;
  private version = 0;
  private workspaceOwnerId: string | null = null;

  readonly state = this.stateSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.stateSignal().status === 'authenticated');
  readonly isRestoring = computed(() => this.stateSignal().status === 'restoring');
  readonly requiresReauthentication = computed(() => this.stateSignal().status === 'reauthentication-required');
  readonly user = computed(() => this.stateSignal().user);
  readonly accessToken = computed(() => this.stateSignal().accessToken);
  get sessionVersion(): number { return this.version; }

  restoreSession(): Observable<void> {
    this.patchState({ status: 'restoring', bootstrapped: false, error: null });
    return this.refreshAccessToken().pipe(
      switchMap(() => this.fetchCurrentUser()),
      map(() => void 0),
      catchError(() => { this.clearAuthState(); return of(void 0); }),
      tap(() => this.patchState({ bootstrapped: true })),
    );
  }

  login(email: string, password: string): Observable<UserPublicDto> {
    return defer(() => {
      const previousOwner = this.workspaceOwnerId;
      const previousStatus = this.stateSignal().status;
      this.invalidatePendingRequests();
      this.patchState({ status: 'restoring', user: null, accessToken: null, error: null });
      return this.authApi.login({ email, password }).pipe(
        tap(accessToken => this.patchState({ accessToken })),
        switchMap(() => this.fetchCurrentUser()),
        tap(user => {
          const resumesWorkspace = previousOwner === user.id;
          this.workspaceOwnerId = user.id;
          if (!resumesWorkspace || previousStatus !== 'reauthentication-required') {
            void this.router.navigate(['/welcome']);
          }
        }),
        catchError(error => {
          this.patchState({
            status: previousOwner ? 'reauthentication-required' : 'anonymous',
            user: null, accessToken: null,
          });
          return throwError(() => error);
        }),
        takeUntil(this.sessionChanged$),
      );
    });
  }

  register(email: string, password: string, pseudo?: string): Observable<UserPublicDto> {
    return this.authApi.register({ email, password, pseudo: pseudo?.trim() || email }).pipe(
      switchMap(() => this.login(email, password)),
    );
  }

  logout(): Observable<void> {
    return defer(() => {
      this.clearAuthState();
      this.resetWorkingState();
      this.workspaceOwnerId = null;
      void this.router.navigate(['/']);
      return this.authApi.logout().pipe(map(() => void 0), catchError(() => of(void 0)));
    });
  }

  deleteAccount(): Observable<void> {
    return this.authApi.deleteMe().pipe(
      map(() => void 0),
      tap(() => {
        this.clearAuthState();
        this.resetWorkingState();
        this.workspaceOwnerId = null;
        void this.router.navigate(['/']);
      }),
    );
  }

  refreshAccessToken(): Observable<string> {
    if (this.refreshInFlight$) return this.refreshInFlight$;
    const version = this.version;
    this.patchState({ isRefreshing: true });
    const refresh$ = this.authApi.refresh().pipe(
      switchMap(response => version === this.version
        ? of(response.accessToken)
        : throwError(() => new Error('Session changed during refresh'))),
      tap(accessToken => {
        // Another tab may have replaced the shared refresh cookie by logging
        // into a different account. Never replay this workspace under that JWT.
        if (this.workspaceOwnerId && this.readTokenSubject(accessToken) !== this.workspaceOwnerId) {
          throw new HttpErrorResponse({ status: 401, statusText: 'Session identity changed' });
        }
        // Only /me may establish a user's identity during bootstrap or login.
        this.patchState({ accessToken, error: null });
      }),
      catchError(error => {
        if (version === this.version && error instanceof HttpErrorResponse && error.status === 401) {
          this.expireSession();
        }
        return throwError(() => error);
      }),
      takeUntil(this.sessionChanged$),
      finalize(() => {
        if (version === this.version) {
          this.patchState({ isRefreshing: false });
          this.refreshInFlight$ = null;
        }
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.refreshInFlight$ = refresh$;
    return refresh$;
  }

  expireSession(): void {
    if (!this.workspaceOwnerId) this.workspaceOwnerId = this.user()?.id ?? null;
    // Do not cancel the refresh error notification currently being delivered.
    this.version++;
    this.refreshInFlight$ = null;
    this.stateSignal.set({ ...initialState, status: 'reauthentication-required', bootstrapped: true });
  }

  clearAuthState(): void {
    this.invalidatePendingRequests();
    this.stateSignal.set({ ...initialState, bootstrapped: true });
  }

  private invalidatePendingRequests(): void {
    this.version++;
    this.refreshInFlight$ = null;
    this.sessionChanged$.next();
    this.patchState({ isRefreshing: false });
  }

  private fetchCurrentUser(): Observable<UserPublicDto> {
    return this.authApi.me().pipe(tap(user => {
      if (this.workspaceOwnerId && this.workspaceOwnerId !== user.id) this.resetWorkingState();
      this.workspaceOwnerId = user.id;
      this.patchState({ user, status: 'authenticated', error: null });
    }));
  }

  private patchState(patch: Partial<AuthState>): void {
    this.stateSignal.update(state => ({ ...state, ...patch }));
  }

  private readTokenSubject(token: string): string | null {
    // This is an identity consistency check on the auth API response, not a
    // replacement for the backend's signature and expiry validation.
    try {
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const decoded: unknown = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')));
      if (typeof decoded === 'object' && decoded !== null && 'sub' in decoded && typeof decoded.sub === 'string') {
        return decoded.sub;
      }
    } catch {
      return null;
    }
    return null;
  }

  private resetWorkingState(): void {
    this.sequencerPanelService.resetPanel();
    this.sequencerRuntimeService.resetRuntimeState();
    this.videoService.clearVideo();
    this.store.dispatch(resetTimeline());
    this.store.dispatch(analysisStoreResetWorkspaceState());
  }
}
