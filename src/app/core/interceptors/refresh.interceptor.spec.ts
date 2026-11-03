import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { refreshInterceptor } from './refresh.interceptor';
import { jwtInterceptor } from './jwt.interceptor';
import { analysisStoreDevAuthInterceptor } from './analysis-store-dev-auth.interceptor';
import { AuthSessionService } from '../auth/auth-session.service';

describe('refreshInterceptor with the application interceptor order', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let token: string;
  let auth: {
    accessToken: jasmine.Spy; user: jasmine.Spy; refreshAccessToken: jasmine.Spy;
    clearAuthState: jasmine.Spy; expireSession: jasmine.Spy;
    requiresReauthentication: jasmine.Spy; isRestoring: jasmine.Spy; sessionVersion: number;
  };
  let router: jasmine.SpyObj<Router>;
  beforeEach(() => {
    token = 'old-token';
    auth = {
      accessToken: jasmine.createSpy().and.callFake(() => token),
      user: jasmine.createSpy().and.returnValue({ id: 'user-1' }),
      refreshAccessToken: jasmine.createSpy().and.callFake(() => { token = 'new-token'; return of(token); }),
      clearAuthState: jasmine.createSpy(), expireSession: jasmine.createSpy(),
      requiresReauthentication: jasmine.createSpy().and.returnValue(false),
      isRestoring: jasmine.createSpy().and.returnValue(false), sessionVersion: 0,
    };
    router = jasmine.createSpyObj('Router', ['navigate']);
    router.navigate.and.resolveTo(true);
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([jwtInterceptor, analysisStoreDevAuthInterceptor, refreshInterceptor])),
      provideHttpClientTesting(), { provide: AuthSessionService, useValue: auth },
      { provide: Router, useValue: router },
    ] });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });
  afterEach(() => backend.verify());
  it('uses the valid token without refresh', () => {
    http.get('/analysis/api/timelines').subscribe();
    const request = backend.expectOne('/analysis/api/timelines');
    expect(request.request.headers.get('Authorization')).toBe('Bearer old-token');
    request.flush([]);
    expect(auth.refreshAccessToken).not.toHaveBeenCalled();
  });
  for (const method of ['POST', 'PATCH']) {
    it(`retries ${method} with the new bearer, preserving body and options`, () => {
      const body = { title: 'Analysis', contentJson: { occurrences: [1] } };
      http.request(method, '/analysis/api/timelines', { body, params: { version: 2 }, withCredentials: true }).subscribe();
      backend.expectOne('/analysis/api/timelines?version=2').flush({}, { status: 401, statusText: 'Unauthorized' });
      const retry = backend.expectOne('/analysis/api/timelines?version=2');
      expect(retry.request.headers.get('Authorization')).toBe('Bearer new-token');
      expect(retry.request.headers.has('x-refresh-retry')).toBeFalse();
      expect(retry.request.method).toBe(method);
      expect(retry.request.body).toEqual(body);
      expect(retry.request.withCredentials).toBeTrue();
      retry.flush({});
      expect(auth.refreshAccessToken).toHaveBeenCalledTimes(1);
    });
  }
  for (const status of [0, 403, 500]) {
    it(`propagates retry error ${status} without clearing authentication`, () => {
      let actualStatus: number | undefined;
      http.get('/me').subscribe({ error: e => actualStatus = e.status });
      backend.expectOne('/me').flush({}, { status: 401, statusText: 'Unauthorized' });
      const retry = backend.expectOne('/me');
      if (status === 0) retry.error(new ProgressEvent('error'));
      else retry.flush({}, { status, statusText: 'Error' });
      expect(actualStatus).toBe(status);
      expect(auth.clearAuthState).not.toHaveBeenCalled();
      expect(auth.expireSession).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  }
  it('expires on a second 401 without refreshing again or redirecting', () => {
    http.get('/me').subscribe({ error: () => undefined });
    backend.expectOne('/me').flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/me').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(auth.expireSession).toHaveBeenCalledTimes(1);
    expect(router.navigate).not.toHaveBeenCalled();
  });
  it('reuses the current token for a late 401', () => {
    http.get('/me?first').subscribe();
    http.get('/me?late').subscribe();
    const first = backend.expectOne('/me?first');
    const late = backend.expectOne('/me?late');
    first.flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/me?first').flush({});
    late.flush({}, { status: 401, statusText: 'Unauthorized' });
    const retry = backend.expectOne('/me?late');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-token');
    retry.flush({});
    expect(auth.refreshAccessToken).toHaveBeenCalledTimes(1);
  });
  for (const url of ['/auth/login', '/auth/refresh', '/auth/logout', 'https://example.org/data']) {
    it(`does not refresh for ${url}`, () => {
      http.post(url, {}).subscribe({ error: () => undefined });
      backend.expectOne(url).flush({}, { status: 401, statusText: 'Unauthorized' });
      expect(auth.refreshAccessToken).not.toHaveBeenCalled();
    });
  }
  it('preserves state on a temporary refresh failure', () => {
    auth.refreshAccessToken.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    http.get('/me').subscribe({ error: () => undefined });
    backend.expectOne('/me').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.clearAuthState).not.toHaveBeenCalled();
    expect(auth.expireSession).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
  it('blocks business requests while reauthentication is required', () => {
    auth.requiresReauthentication.and.returnValue(true);
    http.post('/analysis/api/timelines', {}).subscribe({ error: e => expect(e.status).toBe(401) });
    backend.expectNone('/analysis/api/timelines');
    expect(auth.refreshAccessToken).not.toHaveBeenCalled();
  });
  it('ignores a late 401 after logout or account change', () => {
    http.get('/me').subscribe({ error: () => undefined });
    auth.sessionVersion++;
    backend.expectOne('/me').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.refreshAccessToken).not.toHaveBeenCalled();
    expect(auth.expireSession).not.toHaveBeenCalled();
  });
});
