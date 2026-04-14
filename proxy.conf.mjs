/**
 * Proxy de développement local (Angular dev-server).
 *
 * Auth-service (localhost:3000)
 * - Conserver les préfixes `/auth`, `/users`, `/me` pour rester compatible avec
 *   le cookie refresh `Path=/auth`.
 *
 * Analysis-store-service (localhost:3001)
 * - Router uniquement les routes réellement utilisées par le front,
 *   sans capturer globalement tout `/api` (évite les collisions inter-services).
 */
export default {
  // auth-service
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

  // analysis-store-service
  '/api/imports': {
    target: 'http://localhost:3001',
    secure: false,
    changeOrigin: true,
  },
  '/api/timelines': {
    target: 'http://localhost:3001',
    secure: false,
    changeOrigin: true,
  },
  '/api/panels': {
    target: 'http://localhost:3001',
    secure: false,
    changeOrigin: true,
  },
};
