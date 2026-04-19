import { AppEnvironment } from './environment.model';

/**
 * En développement local on cible le proxy Angular.
 * Cela permet de travailler sans Traefik tout en gardant les mêmes chemins (`/auth`, `/me`, `/users`).
 */
const ANALYSIS_STORE_API_PREFIX = '/analysis';

export const environment: AppEnvironment = {
  production: false,
  analysisStoreDevHeadersEnabled: true,
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
