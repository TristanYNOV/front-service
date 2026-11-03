import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthSessionService } from '../auth/auth-session.service';
import { SequencerPanelService } from '../service/sequencer-panel.service';
import { SequencerRuntimeService } from '../service/sequencer-runtime.service';
import { VideoService } from '../services/video.service';
import { jwtInterceptor } from './jwt.interceptor';
import { analysisStoreDevAuthInterceptor } from './analysis-store-dev-auth.interceptor';
import { refreshInterceptor } from './refresh.interceptor';

// Real HttpClient + real session service; only the HTTP backend and workspace
// side effects are replaced, so single-flight and refresh error handling interact.
describe('HTTP session integration', () => {
  const renewedToken = (subject = 'owner') => `e30.${btoa(JSON.stringify({ sub: subject }))}.test-signature`;
  let http: HttpClient;
  let backend: HttpTestingController;
  let session: AuthSessionService;
  let clearVideo: jasmine.Spy;
  beforeEach(() => {
    clearVideo = jasmine.createSpy('clearVideo');
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([jwtInterceptor, analysisStoreDevAuthInterceptor, refreshInterceptor])),
      provideHttpClientTesting(),
      { provide: Router, useValue: { navigate: jasmine.createSpy().and.resolveTo(true) } },
      { provide: Store, useValue: { dispatch: jasmine.createSpy() } },
      { provide: SequencerPanelService, useValue: { resetPanel: jasmine.createSpy() } },
      { provide: SequencerRuntimeService, useValue: { resetRuntimeState: jasmine.createSpy() } },
      { provide: VideoService, useValue: { clearVideo } },
    ] });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    session = TestBed.inject(AuthSessionService);
    session.login('owner@example.com', 'test-password').subscribe();
    backend.expectOne('/auth/login').flush({ accessToken: 'old-token' });
    backend.expectOne('/me').flush({ id: 'owner', pseudo: 'Coach', email: 'owner@example.com' });
  });
  afterEach(() => backend.verify());

  it('shares one refresh across concurrent 401s and replays each request once', () => {
    let completed = 0;
    http.post('/analysis/api/timelines', { contentJson: { occurrences: [1] } }).subscribe(() => completed++);
    http.get('/analysis/api/panels').subscribe(() => completed++);
    backend.expectOne('/analysis/api/timelines').flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/analysis/api/panels').flush({}, { status: 401, statusText: 'Unauthorized' });
    const refresh = backend.expectOne('/auth/refresh');
    expect(refresh.request.withCredentials).toBeTrue();
    refresh.flush({ accessToken: renewedToken() });
    for (const url of ['/analysis/api/timelines', '/analysis/api/panels']) {
      const retry = backend.expectOne(url);
      expect(retry.request.headers.get('Authorization')).toBe(`Bearer ${renewedToken()}`);
      retry.flush({});
    }
    expect(completed).toBe(2);
    expect(session.isAuthenticated()).toBeTrue();
    expect(clearVideo).not.toHaveBeenCalled();
    expect(session.state().isRefreshing).toBeFalse();
  });

  it('delivers a revoked refresh error to every waiter without resetting the workspace', () => {
    let failures = 0;
    http.get('/analysis/api/timelines').subscribe({ error: () => failures++ });
    http.get('/analysis/api/panels').subscribe({ error: () => failures++ });
    backend.expectOne('/analysis/api/timelines').flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/analysis/api/panels').flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/auth/refresh').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(failures).toBe(2);
    expect(session.requiresReauthentication()).toBeTrue();
    expect(clearVideo).not.toHaveBeenCalled();
  });

  it('can retry a refresh after a transient failure without retaining a failed observable', () => {
    http.get('/me').subscribe({ error: () => undefined });
    backend.expectOne('/me').flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/auth/refresh').flush({}, { status: 500, statusText: 'Error' });
    http.get('/me').subscribe();
    backend.expectOne('/me').flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/auth/refresh').flush({ accessToken: renewedToken() });
    backend.expectOne('/me').flush({ id: 'owner' });
    expect(session.accessToken()).toBe(renewedToken());
    expect(clearVideo).not.toHaveBeenCalled();
  });

  it('blocks old-workspace saves until the reconnecting account is verified by /me', () => {
    session.expireSession();
    session.login('other@example.com', 'test-password').subscribe();
    backend.expectOne('/auth/login').flush({ accessToken: 'other-account-token' });
    const identity = backend.expectOne('/me');
    http.post('/analysis/api/timelines', { title: 'Previous account draft' }).subscribe({
      error: error => expect(error.status).toBe(401),
    });
    backend.expectNone('/analysis/api/timelines');
    expect(clearVideo).not.toHaveBeenCalled();
    identity.flush({ id: 'other', pseudo: 'Other', email: 'other@example.com' });
    expect(clearVideo).toHaveBeenCalledTimes(1);
    expect(session.user()?.id).toBe('other');
    expect(session.isAuthenticated()).toBeTrue();
  });

  for (const token of [renewedToken('another-account'), 'malformed-response']) {
    it(`does not replay a draft with an inconsistent refresh identity (${token === 'malformed-response' ? 'malformed' : 'other account'})`, () => {
      let failure: number | undefined;
      http.post('/analysis/api/timelines', { title: 'Owner draft' }).subscribe({ error: error => failure = error.status });
      backend.expectOne('/analysis/api/timelines').flush({}, { status: 401, statusText: 'Unauthorized' });
      backend.expectOne('/auth/refresh').flush({ accessToken: token });
      backend.expectNone('/analysis/api/timelines');
      expect(failure).toBe(401);
      expect(session.requiresReauthentication()).toBeTrue();
      expect(session.accessToken()).toBeNull();
      expect(clearVideo).not.toHaveBeenCalled();
    });
  }
});
