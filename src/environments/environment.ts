import { AppEnvironment } from './environment.model';

export const environment: AppEnvironment = {
  production: false,
  analysisStoreDevHeadersEnabled: true,
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
