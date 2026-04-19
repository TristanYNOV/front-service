import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthSessionService } from '../auth/auth-session.service';
import { runtimeEnvironment } from '../config/runtime-environment';

function normalizePrefix(prefix: string): string {
  const trimmed = prefix.trim();
  if (!trimmed) {
    return '';
  }

  return trimmed.replace(/\/+$/, '');
}

function getAnalysisStoreProtectedPrefixes(): string[] {
  const analysisStoreApiBase = `${normalizePrefix(runtimeEnvironment.analysisStoreApiPrefix)}/api`;
  return [`${analysisStoreApiBase}/imports`, `${analysisStoreApiBase}/panels`, `${analysisStoreApiBase}/timelines`];
}

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

  const protectedPrefixes = getAnalysisStoreProtectedPrefixes();

  if (!/^https?:\/\//i.test(url)) {
    return protectedPrefixes.some(prefix => url.startsWith(prefix));
  }

  try {
    const parsed = new URL(url);
    const isSameOrigin = typeof window !== 'undefined' ? parsed.origin === window.location.origin : false;

    return isSameOrigin && protectedPrefixes.some(prefix => parsed.pathname.startsWith(prefix));
  } catch {
    return false;
  }
}
