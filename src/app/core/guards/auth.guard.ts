import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthSessionService } from '../auth/auth-session.service';

export const authGuard: CanActivateFn = () => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  // On attend la fin de la restauration initiale pour éviter des redirections chaotiques au boot.
  return toObservable(authSession.state).pipe(
    filter(state => state.bootstrapped),
    take(1),
    map(state => (state.status === 'authenticated' ? true : router.parseUrl('/')))
  );
};
