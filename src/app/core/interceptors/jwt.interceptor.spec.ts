import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { jwtInterceptor } from './jwt.interceptor';
import { AuthSessionService } from '../auth/auth-session.service';

describe('jwtInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  const authSessionMock = {
    accessToken: jasmine.createSpy('accessToken'),
  };

  beforeEach(() => {
    authSessionMock.accessToken.calls.reset();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthSessionService, useValue: authSessionMock },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('injects bearer token for allowed API URLs', () => {
    authSessionMock.accessToken.and.returnValue('jwt-allowed');

    http.get('/me').subscribe();

    const req = httpMock.expectOne('/me');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-allowed');
    req.flush({});
  });

  it('does not inject bearer token for external URLs', () => {
    authSessionMock.accessToken.and.returnValue('jwt-allowed');

    http.get('https://example.org/anything').subscribe();

    const req = httpMock.expectOne('https://example.org/anything');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });
});
