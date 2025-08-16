import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';

// Guard placeholder for future license validation via micro-service
export const licenseGuard: CanActivateFn = () => {
  const http = inject(HttpClient);
  const router = inject(Router);

  // TODO: replace '/api/license/validate' with the actual license validation endpoint
  return http.get<{ valid: boolean }>('/api/license/validate').pipe(
    map(response => (response.valid ? true : router.parseUrl('/'))),
    catchError(() => of(router.parseUrl('/')))
  );
};
