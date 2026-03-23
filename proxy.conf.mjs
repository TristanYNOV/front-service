/**
 * Proxy dev local:
 * - `/auth/*` est conservé tel quel pour respecter le cookie refresh `Path=/auth`.
 * - `/users` et `/me` sont proxifiés aussi pour garder des appels same-origin côté front.
 */
export default {
  '/auth': {
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
  },
  '/users': {
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
  },
  '/me': {
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
  },
  '/api': {
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
  },
};
