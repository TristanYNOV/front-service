import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { refreshInterceptor } from './refresh.interceptor';
import { AuthSessionService } from '../auth/auth-session.service';

describe('refreshInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authSessionMock: {
    refreshAccessToken: jasmine.Spy;
    clearAuthState: jasmine.Spy;
  };
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authSessionMock = {
      refreshAccessToken: jasmine.createSpy('refreshAccessToken'),
      clearAuthState: jasmine.createSpy('clearAuthState'),
    };
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    routerSpy.navigate.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([refreshInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthSessionService, useValue: authSessionMock },
        { provide: Router, useValue: routerSpy },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('retries one time after successful refresh on 401', () => {
    authSessionMock.refreshAccessToken.and.returnValue(of('new-token'));

    let responseBody: unknown;
    http.get('/me').subscribe(res => (responseBody = res));

    const first = httpMock.expectOne('/me');
    first.flush({}, { status: 401, statusText: 'Unauthorized' });

    const retried = httpMock.expectOne('/me');
    expect(retried.request.headers.get('x-refresh-retry')).toBe('1');
    retried.flush({ ok: true });

    expect(responseBody).toEqual({ ok: true });
    expect(authSessionMock.refreshAccessToken).toHaveBeenCalledTimes(1);
  });

  it('excludes /auth/login from refresh retry mechanism', () => {
    http.post('/auth/login', { email: 'x', password: 'y' }).subscribe({
      error: () => undefined,
    });

    const req = httpMock.expectOne('/auth/login');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(authSessionMock.refreshAccessToken).not.toHaveBeenCalled();
  });

  it('cleans auth state and redirects when refresh fails', () => {
    authSessionMock.refreshAccessToken.and.returnValue(throwError(() => new Error('refresh failed')));

    http.get('/me').subscribe({
      error: () => undefined,
    });

    const req = httpMock.expectOne('/me');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(authSessionMock.clearAuthState).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });
});
