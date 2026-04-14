import { AppEnvironment } from './environment.model';

/**
 * En production on conserve des chemins relatifs pour laisser l'infra
 * (Nginx/Traefik) router vers les bons services sans exposer de domaine API en dur.
 */
export const environment: AppEnvironment = {
  production: true,
  analysisStoreDevHeadersEnabled: false,
  apiAllowedPrefixes: ['/auth', '/api', '/me', '/users'],
  authEndpoints: {
    login: '/auth/login',
    register: '/users',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/me',
  },
  analysisStoreEndpoints: {
    importsTimelinesValidate: '/api/imports/timelines/validate',
    importsPanelsValidate: '/api/imports/panels/validate',
    timelines: '/api/timelines',
    panels: '/api/panels',
  },
};
