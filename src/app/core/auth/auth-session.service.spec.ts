import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { of, Subject, throwError } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { AuthSessionService } from './auth-session.service';
import { SequencerPanelService } from '../service/sequencer-panel.service';
import { SequencerRuntimeService } from '../service/sequencer-runtime.service';
import { VideoService } from '../services/video.service';

function createAuthApiMock() {
  return {
    login: jasmine.createSpy('login'),
    register: jasmine.createSpy('register'),
    refresh: jasmine.createSpy('refresh'),
    logout: jasmine.createSpy('logout'),
    me: jasmine.createSpy('me'),
    deleteMe: jasmine.createSpy('deleteMe'),
  };
}

describe('AuthSessionService', () => {
  let service: AuthSessionService;
  let authApiMock: ReturnType<typeof createAuthApiMock>;
  let routerSpy: jasmine.SpyObj<Router>;
  let storeSpy: jasmine.SpyObj<Store>;

  beforeEach(() => {
    authApiMock = createAuthApiMock();
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    routerSpy.navigate.and.resolveTo(true);
    storeSpy = jasmine.createSpyObj<Store>('Store', ['dispatch']);

    TestBed.configureTestingModule({
      providers: [
        AuthSessionService,
        { provide: AuthApiService, useValue: authApiMock },
        { provide: Router, useValue: routerSpy },
        { provide: Store, useValue: storeSpy },
        { provide: SequencerPanelService, useValue: { resetPanel: jasmine.createSpy('resetPanel') } },
        { provide: SequencerRuntimeService, useValue: { resetRuntimeState: jasmine.createSpy('resetRuntimeState') } },
        { provide: VideoService, useValue: { clearVideo: jasmine.createSpy('clearVideo') } },
      ],
    });

    service = TestBed.inject(AuthSessionService);
  });

  it('restores session with refresh + me', fakeAsync(() => {
    authApiMock.refresh.and.returnValue(of({ accessToken: 'token-1' }));
    authApiMock.me.and.returnValue(of({ id: '1', pseudo: 'coach', email: 'coach@ab.fr' }));

    service.restoreSession().subscribe();
    tick();

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.user()?.email).toBe('coach@ab.fr');
    expect(service.state().bootstrapped).toBeTrue();
  }));

  it('keeps anonymous state when refresh fails at bootstrap', fakeAsync(() => {
    authApiMock.refresh.and.returnValue(throwError(() => new Error('401')));

    service.restoreSession().subscribe();
    tick();

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.state().status).toBe('anonymous');
    expect(service.state().bootstrapped).toBeTrue();
  }));

  it('sets token before calling /me during login flow', fakeAsync(() => {
    authApiMock.login.and.returnValue(of('jwt-1'));
    authApiMock.me.and.callFake(() => {
      // Régression évitée: /me doit partir avec un token déjà disponible pour l'interceptor JWT.
      expect(service.accessToken()).toBe('jwt-1');
      return of({ id: '2', pseudo: 'user', email: 'user@ab.fr' });
    });

    service.login('user@ab.fr', 'Password1!').subscribe();
    tick();

    expect(service.user()?.id).toBe('2');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/welcome']);
  }));

  it('uses email as pseudo fallback when register pseudo is empty', fakeAsync(() => {
    authApiMock.register.and.returnValue(of({ id: '3', pseudo: 'user@ab.fr', email: 'user@ab.fr' }));
    authApiMock.login.and.returnValue(of('jwt-2'));
    authApiMock.me.and.returnValue(of({ id: '3', pseudo: 'user@ab.fr', email: 'user@ab.fr' }));

    service.register('user@ab.fr', 'Password1!', '   ').subscribe();
    tick();

    expect(authApiMock.register).toHaveBeenCalledWith({
      email: 'user@ab.fr',
      password: 'Password1!',
      pseudo: 'user@ab.fr',
    });
  }));

  it('keeps register -> auto-login -> /me sequence and redirects to welcome', fakeAsync(() => {
    authApiMock.register.and.returnValue(of({ id: '4', pseudo: 'rookie', email: 'rookie@ab.fr' }));
    authApiMock.login.and.returnValue(of('jwt-3'));
    authApiMock.me.and.callFake(() => {
      expect(service.accessToken()).toBe('jwt-3');
      return of({ id: '4', pseudo: 'rookie', email: 'rookie@ab.fr' });
    });

    service.register('rookie@ab.fr', 'Password1!', 'rookie').subscribe();
    tick();

    expect(service.user()?.pseudo).toBe('rookie');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/welcome']);
  }));

  it('coalesces concurrent refresh calls (single-flight)', fakeAsync(() => {
    const refreshSubject = new Subject<{ accessToken: string }>();
    authApiMock.refresh.and.returnValue(refreshSubject.asObservable());

    let tokenA = '';
    let tokenB = '';

    service.refreshAccessToken().subscribe(token => (tokenA = token));
    service.refreshAccessToken().subscribe(token => (tokenB = token));

    expect(authApiMock.refresh).toHaveBeenCalledTimes(1);
    refreshSubject.next({ accessToken: 'shared-token' });
    refreshSubject.complete();
    tick();

    expect(tokenA).toBe('shared-token');
    expect(tokenB).toBe('shared-token');
  }));

  it('cleans frontend state on logout even when API fails', fakeAsync(() => {
    authApiMock.login.and.returnValue(of('jwt-1'));
    authApiMock.me.and.returnValue(of({ id: '2', pseudo: 'user', email: 'user@ab.fr' }));
    authApiMock.logout.and.returnValue(throwError(() => new Error('network')));

    service.login('user@ab.fr', 'Password1!').subscribe();
    tick();
    service.logout().subscribe();
    tick();

    expect(service.state().status).toBe('anonymous');
    expect(service.accessToken()).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  }));

  it('deletes account and clears frontend state', fakeAsync(() => {
    authApiMock.login.and.returnValue(of('jwt-1'));
    authApiMock.me.and.returnValue(of({ id: '2', pseudo: 'user', email: 'user@ab.fr' }));
    authApiMock.deleteMe.and.returnValue(of({ message: 'suppression demandée' }));

    service.login('user@ab.fr', 'Password1!').subscribe();
    tick();
    service.deleteAccount().subscribe();
    tick();

    expect(authApiMock.deleteMe).toHaveBeenCalled();
    expect(service.state().status).toBe('anonymous');
    expect(service.accessToken()).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  }));

  function loginAs(id = 'owner'): void {
    authApiMock.login.and.returnValue(of('access-token'));
    authApiMock.me.and.returnValue(of({ id, pseudo: id, email: `${id}@example.com` }));
    service.login(`${id}@example.com`, 'test-password').subscribe();
    routerSpy.navigate.calls.reset();
  }

  function expectWorkspaceUntouched(): void {
    expect(TestBed.inject(SequencerPanelService).resetPanel).not.toHaveBeenCalled();
    expect(TestBed.inject(SequencerRuntimeService).resetRuntimeState).not.toHaveBeenCalled();
    expect(TestBed.inject(VideoService).clearVideo).not.toHaveBeenCalled();
    expect(storeSpy.dispatch).not.toHaveBeenCalled();
  }

  it('preserves the workspace and reports expired authentication on refresh 401', () => {
    loginAs();
    authApiMock.refresh.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    let status: number | undefined;
    service.refreshAccessToken().subscribe({ error: error => status = error.status });
    expect(status).toBe(401);
    expect(service.requiresReauthentication()).toBeTrue();
    expect(service.accessToken()).toBeNull();
    expect(service.user()).toBeNull();
    expect(service.state().isRefreshing).toBeFalse();
    expectWorkspaceUntouched();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  for (const status of [0, 403, 500]) {
    it(`preserves authentication and workspace on temporary refresh error ${status}`, () => {
      loginAs();
      authApiMock.refresh.and.returnValue(throwError(() => new HttpErrorResponse({ status })));
      service.refreshAccessToken().subscribe({ error: () => undefined });
      expect(service.isAuthenticated()).toBeTrue();
      expect(service.accessToken()).toBe('access-token');
      expect(service.state().isRefreshing).toBeFalse();
      expectWorkspaceUntouched();
    });
  }

  it('resumes the same account without navigation or workspace reset', () => {
    loginAs();
    service.expireSession();
    service.login('owner@example.com', 'test-password').subscribe();
    expect(service.isAuthenticated()).toBeTrue();
    expectWorkspaceUntouched();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('clears the previous workspace before exposing a different authenticated account', () => {
    loginAs();
    service.expireSession();
    authApiMock.login.and.returnValue(of('other-token'));
    authApiMock.me.and.returnValue(of({ id: 'other', pseudo: 'other', email: 'other@example.com' }));
    service.login('other@example.com', 'test-password').subscribe();
    expect(service.user()?.id).toBe('other');
    expect(TestBed.inject(VideoService).clearVideo).toHaveBeenCalledTimes(1);
    expect(TestBed.inject(SequencerPanelService).resetPanel).toHaveBeenCalledTimes(1);
    expect(storeSpy.dispatch).toHaveBeenCalledTimes(2);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/welcome']);
  });

  it('preserves the draft after a failed reconnection', () => {
    loginAs();
    service.expireSession();
    authApiMock.login.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    service.login('owner@example.com', 'incorrect').subscribe({ error: () => undefined });
    expect(service.requiresReauthentication()).toBeTrue();
    expectWorkspaceUntouched();
  });

  it('cancels refresh immediately on logout, before its HTTP response', () => {
    loginAs();
    const refresh = new Subject<{ accessToken: string }>();
    const logout = new Subject<{ message: string }>();
    authApiMock.refresh.and.returnValue(refresh);
    authApiMock.logout.and.returnValue(logout);
    service.refreshAccessToken().subscribe();
    service.logout().subscribe();
    refresh.next({ accessToken: 'late-token' });
    refresh.complete();
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.accessToken()).toBeNull();
    expect(TestBed.inject(VideoService).clearVideo).toHaveBeenCalledTimes(1);
    logout.next({ message: 'Logged out' });
    logout.complete();
  });

  it('does not apply a previous account refresh after a new login', () => {
    loginAs();
    const refresh = new Subject<{ accessToken: string }>();
    authApiMock.refresh.and.returnValue(refresh);
    service.refreshAccessToken().subscribe();
    loginAs('other');
    refresh.next({ accessToken: 'late-token' });
    refresh.complete();
    expect(service.user()?.id).toBe('other');
    expect(service.accessToken()).toBe('access-token');
    expect(service.state().isRefreshing).toBeFalse();
  });
});
