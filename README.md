# Front Service (Angular)

Frontend Angular du projet Analyse Basket.

## Prérequis
- Node.js 18+
- npm
- `auth-service` lancé localement (par défaut sur `http://localhost:3000`)

## Installation
```bash
npm install
```

## Quickstart dev local
```bash
npm start
```
- Frontend: `http://localhost:4200`
- Le mode dev utilise `proxy.conf.mjs` pour proxifier `/auth`, `/users`, `/me` vers `http://localhost:3000`.
- Le préfixe `/auth` est conservé pour respecter le cookie refresh (`Path=/auth`).

## Flow auth MVP (résumé)
1. Au boot: tentative `POST /auth/refresh`, puis `GET /me` si succès.
2. Login: `POST /auth/login`, token access en mémoire, puis `GET /me`.
3. Register: `POST /users` (pseudo optionnel dans l'UI, fallback email), puis login automatique.
4. Logout: `POST /auth/logout`, nettoyage frontend même si erreur réseau.

## Environnements
- `src/environments/environment.development.ts`: chemins API pour dev (avec proxy Angular).
- `src/environments/environment.production.ts`: chemins relatifs pour fonctionnement derrière infra / Traefik.

## Tests
```bash
npm test
npm run lint
```

## Troubleshooting rapide
- **401 ou erreurs réseau au login**: vérifier que `auth-service` tourne bien sur `localhost:3000`.
- **Le proxy semble ignoré**: vérifier `angular.json` (`serve.development.proxyConfig`) et redémarrer `npm start`.
- **Refresh KO au reload**: vérifier que le cookie `refreshToken` est bien reçu et que le chemin `/auth` n'est pas modifié.
- **Toujours anonyme après reload**: confirmer que `/auth/refresh` répond correctement puis que `/me` est accessible avec le bearer.

## Doc auth frontend
Voir `docs/frontend/auth-integration.md` pour les détails d'architecture et d'intégration.
