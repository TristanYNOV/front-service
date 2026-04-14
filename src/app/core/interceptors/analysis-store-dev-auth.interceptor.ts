import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthSessionService } from '../auth/auth-session.service';
import { runtimeEnvironment } from '../config/runtime-environment';

const ANALYSIS_STORE_PROTECTED_PREFIXES = ['/api/imports', '/api/panels', '/api/timelines'];

export const analysisStoreDevAuthInterceptor: HttpInterceptorFn = (req, next) => {
  if (!runtimeEnvironment.analysisStoreDevHeadersEnabled || !isAnalysisStoreProtectedUrl(req.url)) {
    return next(req);
  }

  const userId = inject(AuthSessionService).user()?.id?.trim();
  if (!userId || req.headers.has('x-auth-user-id')) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        'x-auth-user-id': userId,
      },
    }),
  );
};

function isAnalysisStoreProtectedUrl(url: string): boolean {
  if (!url) {
    return false;
  }

  if (!/^https?:\/\//i.test(url)) {
    return ANALYSIS_STORE_PROTECTED_PREFIXES.some(prefix => url.startsWith(prefix));
  }

  try {
    const parsed = new URL(url);
    const isSameOrigin = typeof window !== 'undefined' ? parsed.origin === window.location.origin : false;

    return isSameOrigin && ANALYSIS_STORE_PROTECTED_PREFIXES.some(prefix => parsed.pathname.startsWith(prefix));
  } catch {
    return false;
  }
}
