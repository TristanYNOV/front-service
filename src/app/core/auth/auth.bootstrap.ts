import { APP_INITIALIZER, Provider } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthSessionService } from './auth-session.service';

export function provideAuthBootstrap(): Provider {
  return {
    provide: APP_INITIALIZER,
    multi: true,
    deps: [AuthSessionService],
    useFactory: (authSession: AuthSessionService) => async () => {
      await firstValueFrom(authSession.restoreSession());
    },
  };
}
