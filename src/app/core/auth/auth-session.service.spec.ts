import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { AuthSessionService } from './auth-session.service';

function createAuthApiMock() {
  return {
    login: jasmine.createSpy('login'),
    register: jasmine.createSpy('register'),
    refresh: jasmine.createSpy('refresh'),
    logout: jasmine.createSpy('logout'),
    me: jasmine.createSpy('me'),
  };
}

describe('AuthSessionService', () => {
  let service: AuthSessionService;
  let authApiMock: ReturnType<typeof createAuthApiMock>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authApiMock = createAuthApiMock();
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    routerSpy.navigate.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        AuthSessionService,
        { provide: AuthApiService, useValue: authApiMock },
        { provide: Router, useValue: routerSpy },
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

  it('logs in and hydrates current user', fakeAsync(() => {
    authApiMock.login.and.returnValue(of('jwt-1'));
    authApiMock.me.and.returnValue(of({ id: '2', pseudo: 'user', email: 'user@ab.fr' }));

    service.login('user@ab.fr', 'Password1!').subscribe();
    tick();

    expect(service.accessToken()).toBe('jwt-1');
    expect(service.user()?.id).toBe('2');
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
});
