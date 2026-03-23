import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthSessionService } from '../auth/auth-session.service';
import { ApiUrlPolicyService } from '../http/api-url-policy.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authSession = inject(AuthSessionService);
  const apiPolicy = inject(ApiUrlPolicyService);

  const token = authSession.accessToken();
  if (!token || !apiPolicy.isAllowedApiUrl(req.url)) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    })
  );
};
