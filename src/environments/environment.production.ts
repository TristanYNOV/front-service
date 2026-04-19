import { AppEnvironment } from './environment.model';

/**
 * En production on conserve des chemins relatifs pour laisser l'infra
 * (Nginx/Traefik) router vers les bons services sans exposer de domaine API en dur.
 */
const ANALYSIS_STORE_API_PREFIX = '/analysis';

export const environment: AppEnvironment = {
  production: true,
  analysisStoreDevHeadersEnabled: false,
  analysisStoreApiPrefix: ANALYSIS_STORE_API_PREFIX,
  apiAllowedPrefixes: ['/auth', '/analysis/api', '/api', '/me', '/users'],
  authEndpoints: {
    login: '/auth/login',
    register: '/users',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/me',
  },
  analysisStoreEndpoints: {
    importsTimelinesValidate: `${ANALYSIS_STORE_API_PREFIX}/api/imports/timelines/validate`,
    importsPanelsValidate: `${ANALYSIS_STORE_API_PREFIX}/api/imports/panels/validate`,
    timelines: `${ANALYSIS_STORE_API_PREFIX}/api/timelines`,
    panels: `${ANALYSIS_STORE_API_PREFIX}/api/panels`,
  },
};
