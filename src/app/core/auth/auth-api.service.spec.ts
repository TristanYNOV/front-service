import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthApiService } from './auth-api.service';
import { environment } from '../../../environments/environment';

describe('AuthApiService', () => {
  let service: AuthApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('calls login contract and expects a text JWT body', () => {
    service.login({ email: 'test@example.com', password: 'Password1!' }).subscribe();

    const req = httpMock.expectOne(environment.authEndpoints.login);
    expect(req.request.method).toBe('POST');
    expect(req.request.responseType).toBe('text');
    expect(req.request.withCredentials).toBeTrue();
    req.flush('jwt-token');
  });

  it('calls refresh contract and returns access token object', () => {
    service.refresh().subscribe(response => {
      expect(response.accessToken).toBe('new-token');
    });

    const req = httpMock.expectOne(environment.authEndpoints.refresh);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ accessToken: 'new-token' });
  });
});
