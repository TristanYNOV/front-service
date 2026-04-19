/**
 * Proxy de développement local (Angular dev-server).
 *
 * Auth-service (localhost:3000)
 * - Conserver les préfixes `/auth`, `/users`, `/me` pour rester compatible avec
 *   le cookie refresh `Path=/auth`.
 *
 * Analysis-store-service (localhost:3001)
 * - Le front appelle le préfixe public `/analysis/api/...` (même contrat qu'en prod derrière Traefik).
 * - En dev, le proxy retire `/analysis` pour cibler le service local qui expose ses routes internes en `/api/...`.
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
  '/analysis/api/imports': {
    target: 'http://localhost:3001',
    secure: false,
    changeOrigin: true,
    pathRewrite: { '^/analysis': '' },
  },
  '/analysis/api/timelines': {
    target: 'http://localhost:3001',
    secure: false,
    changeOrigin: true,
    pathRewrite: { '^/analysis': '' },
  },
  '/analysis/api/panels': {
    target: 'http://localhost:3001',
    secure: false,
    changeOrigin: true,
    pathRewrite: { '^/analysis': '' },
  },
};
