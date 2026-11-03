import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { firstValueFrom, isObservable, of } from 'rxjs';
import { authGuard } from './auth.guard';
import { AuthSessionService } from '../auth/auth-session.service';
import { AuthStatus } from '../auth/auth.models';

describe('authGuard', () => {
  const state = signal({
    status: 'anonymous' as AuthStatus,
    user: null,
    accessToken: null,
    isRefreshing: false,
    bootstrapped: true,
    error: null,
  });

  const authSessionMock = {
    state,
  };

  const redirectTree = {} as ReturnType<Router['parseUrl']>;
  const routerSpy = {
    parseUrl: jasmine.createSpy('parseUrl').and.returnValue(redirectTree),
  };

  beforeEach(() => {
    routerSpy.parseUrl.calls.reset();

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthSessionService, useValue: authSessionMock },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  async function resolveGuardResult() {
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    const asObservable = isObservable(result) ? result : of(result);
    return firstValueFrom(asObservable);
  }

  it('allows authenticated users', async () => {
    state.set({ ...state(), status: 'authenticated', bootstrapped: true });

    const result = await resolveGuardResult();

    expect(result).toBeTrue();
  });

  it('redirects anonymous users to public route', async () => {
    state.set({ ...state(), status: 'anonymous', bootstrapped: true });

    const result = await resolveGuardResult();

    expect(result).toBe(redirectTree);
    expect(routerSpy.parseUrl).toHaveBeenCalledWith('/');
  });

  it('does not grant a new private navigation while reauthentication is required', async () => {
    state.set({ ...state(), status: 'reauthentication-required', bootstrapped: true });
    expect(await resolveGuardResult()).toBe(redirectTree);
  });
});
