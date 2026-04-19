import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthSessionService } from '../auth/auth-session.service';
import { analysisStoreDevAuthInterceptor } from './analysis-store-dev-auth.interceptor';
import { runtimeEnvironment } from '../config/runtime-environment';

describe('analysisStoreDevAuthInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authSessionMock: { user: jasmine.Spy };
  let previousEnabled: boolean;
  let previousApiPrefix: string;

  beforeEach(() => {
    previousEnabled = runtimeEnvironment.analysisStoreDevHeadersEnabled;
    previousApiPrefix = runtimeEnvironment.analysisStoreApiPrefix;
    runtimeEnvironment.analysisStoreDevHeadersEnabled = true;
    runtimeEnvironment.analysisStoreApiPrefix = '/analysis';

    authSessionMock = {
      user: jasmine.createSpy('user').and.returnValue({ id: 'user-123', pseudo: 'coach', email: 'coach@ab.fr' }),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([analysisStoreDevAuthInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthSessionService, useValue: authSessionMock },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    runtimeEnvironment.analysisStoreDevHeadersEnabled = previousEnabled;
    runtimeEnvironment.analysisStoreApiPrefix = previousApiPrefix;
    httpMock.verify();
  });

  it('injects x-auth-user-id on protected analysis-store routes', () => {
    http.get('/analysis/api/panels').subscribe();

    const req = httpMock.expectOne('/analysis/api/panels');
    expect(req.request.headers.get('x-auth-user-id')).toBe('user-123');
    req.flush([]);
  });

  it('does not inject headers outside analysis-store protected routes', () => {
    http.get('/auth/sessions').subscribe();

    const req = httpMock.expectOne('/auth/sessions');
    expect(req.request.headers.has('x-auth-user-id')).toBeFalse();
    req.flush([]);
  });

  it('does not inject invalid header when user is unavailable', () => {
    authSessionMock.user.and.returnValue(null);

    http.get('/analysis/api/timelines').subscribe();

    const req = httpMock.expectOne('/analysis/api/timelines');
    expect(req.request.headers.has('x-auth-user-id')).toBeFalse();
    req.flush([]);
  });

  it('keeps existing x-auth-user-id header untouched', () => {
    http.get('/analysis/api/imports/timelines/validate', {
      headers: { 'x-auth-user-id': 'manual-user' },
    }).subscribe();

    const req = httpMock.expectOne('/analysis/api/imports/timelines/validate');
    expect(req.request.headers.get('x-auth-user-id')).toBe('manual-user');
    req.flush({});
  });

  it('is disabled when environment flag is false', () => {
    runtimeEnvironment.analysisStoreDevHeadersEnabled = false;

    http.get('/analysis/api/panels').subscribe();

    const req = httpMock.expectOne('/analysis/api/panels');
    expect(req.request.headers.has('x-auth-user-id')).toBeFalse();
    req.flush([]);
  });
});
