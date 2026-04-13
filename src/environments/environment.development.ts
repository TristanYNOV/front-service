import { AppEnvironment } from './environment.model';

/**
 * En développement local on cible le proxy Angular.
 * Cela permet de travailler sans Traefik tout en gardant les mêmes chemins (`/auth`, `/me`, `/users`).
 */
export const environment: AppEnvironment = {
  production: false,
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
