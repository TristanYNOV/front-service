import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthSessionService } from '../auth/auth-session.service';
import { runtimeEnvironment } from '../config/runtime-environment';

const EXCLUDED_RETRY_URLS = [
  runtimeEnvironment.authEndpoints.login,
  runtimeEnvironment.authEndpoints.refresh,
  runtimeEnvironment.authEndpoints.logout,
];

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  const isRetriedRequest = req.headers.has('x-refresh-retry');
  const isExcluded = EXCLUDED_RETRY_URLS.some(url => req.url.startsWith(url));

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || isExcluded || isRetriedRequest) {
        return throwError(() => error);
      }

      return authSession.refreshAccessToken().pipe(
        switchMap(() =>
          next(
            req.clone({
              headers: req.headers.set('x-refresh-retry', '1'),
            })
          )
        ),
        catchError(refreshError => {
          authSession.clearAuthState();
          void router.navigate(['/']);
          return throwError(() => refreshError);
        })
      );
    })
  );
};
