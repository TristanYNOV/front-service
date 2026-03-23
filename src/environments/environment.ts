import { AppEnvironment } from './environment.model';

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
};
