import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, of, switchMap, throwError } from 'rxjs';
import { AuthSessionService } from '../auth/auth-session.service';
import { runtimeEnvironment } from '../config/runtime-environment';
import { ApiUrlPolicyService } from '../http/api-url-policy.service';

const AUTH_RETRIED = new HttpContextToken(() => false);
const EXCLUDED_RETRY_URLS = [
  runtimeEnvironment.authEndpoints.login,
  runtimeEnvironment.authEndpoints.register,
  runtimeEnvironment.authEndpoints.refresh,
  runtimeEnvironment.authEndpoints.logout,
];

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authSession = inject(AuthSessionService);
  const apiPolicy = inject(ApiUrlPolicyService);
  const isExcluded = EXCLUDED_RETRY_URLS.some(url => req.url.split('?')[0] === url);
  if (!apiPolicy.isAllowedApiUrl(req.url) || isExcluded) return next(req);

  const isMe = req.url.split('?')[0] === runtimeEnvironment.authEndpoints.me;
  if (authSession.requiresReauthentication() || (authSession.isRestoring() && !isMe)) {
    return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Reauthentication required', url: req.url }));
  }

  const sessionVersion = authSession.sessionVersion;
  const sentToken = req.headers.get('Authorization');
  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 ||
          req.context.get(AUTH_RETRIED) || !sentToken || sessionVersion !== authSession.sessionVersion) {
        return throwError(() => error);
      }

      const currentToken = authSession.accessToken();
      const token$ = currentToken && `Bearer ${currentToken}` !== sentToken
        ? of(currentToken)
        : authSession.refreshAccessToken();

      // Refresh errors are handled by the session service; business errors from
      // the retry must not clear authentication or the local workspace.
      return token$.pipe(
        switchMap(token => {
          if (sessionVersion !== authSession.sessionVersion) return throwError(() => error);
          return next(req.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
            context: req.context.set(AUTH_RETRIED, true),
          })).pipe(
            catchError(retryError => {
              if (retryError instanceof HttpErrorResponse && retryError.status === 401 &&
                  sessionVersion === authSession.sessionVersion) authSession.expireSession();
              return throwError(() => retryError);
            }),
          );
        }),
      );
    }),
  );
};
