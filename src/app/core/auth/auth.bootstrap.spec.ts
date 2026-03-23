import { APP_INITIALIZER } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideAuthBootstrap } from './auth.bootstrap';
import { AuthSessionService } from './auth-session.service';

describe('provideAuthBootstrap', () => {
  it('runs restoreSession during app bootstrap', async () => {
    const authSessionMock = {
      restoreSession: jasmine.createSpy('restoreSession').and.returnValue(of(void 0)),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: AuthSessionService, useValue: authSessionMock }, provideAuthBootstrap()],
    });

    const initializers = TestBed.inject(APP_INITIALIZER) as (() => Promise<void>)[];

    await Promise.all(initializers.map(initializer => initializer()));

    expect(authSessionMock.restoreSession).toHaveBeenCalled();
  });
});
