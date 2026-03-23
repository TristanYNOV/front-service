# Auth frontend (MVP) — intégration `auth-service`

## Objectif
Mettre en place une base d'authentification robuste côté Angular en respectant les contrats backend (`docs/API/Auth/*`) sans dupliquer la logique serveur.

## Architecture retenue
- `AuthApiService` : couche HTTP strictement alignée sur les routes backend (`/users`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/me`).
- `AuthSessionService` : état auth **en mémoire uniquement** (status, user, access token, refresh en cours, bootstrap).
- `APP_INITIALIZER` (`provideAuthBootstrap`) : restauration de session au démarrage.
- Interceptors HTTP :
  - `jwtInterceptor` → ajoute `Authorization: Bearer` seulement sur une allowlist API.
  - `refreshInterceptor` → gère les 401 utiles, single-flight refresh, retry unique.
- `authGuard` : protection UX/navigation (pas sécurité backend).

## Flows implémentés
1. **Boot app**
   - état `restoring`
   - `POST /auth/refresh`
   - si OK: token en mémoire puis `GET /me`
   - si KO: retour `anonymous` sans bloquer les routes publiques.

2. **Login**
   - `POST /auth/login`
   - token stocké en mémoire
   - `GET /me` pour hydrater l'utilisateur courant.

3. **Register**
   - `POST /users` (contrat backend) avec `pseudo`
   - si le pseudo n'est pas saisi côté UI, fallback automatique sur l'email
   - puis login automatique pour obtenir le JWT + `/me`.

4. **Logout**
   - `POST /auth/logout`
   - nettoyage local **même si l'appel échoue**.

5. **Refresh sur 401**
   - exclusion explicite de `login/refresh/logout`
   - un seul refresh réseau à la fois (single-flight)
   - retry d'une requête une seule fois (header `x-refresh-retry`).

## Sécurité frontend
- Access token: **jamais** `localStorage/sessionStorage`; uniquement mémoire runtime.
- Refresh token: **jamais** manipulé côté JS (cookie HttpOnly backend).
- Aucun log sensible (mot de passe, token).
- Aucune dépendance aux rôles JWT côté MVP frontend.

## Routes publiques / privées
Allowlist publique:
- `/`
- `/discover`
- `**`

Toutes les autres routes métier sont privées par défaut via `authGuard`.
`licenseGuard` est conservé non bloquant (placeholder).

## Environnements + proxy
- `src/environments/*` définit les endpoints et l'allowlist d'URLs API.
- En dev, le proxy Angular garde le préfixe `/auth` pour rester compatible avec le cookie `refreshToken` en `Path=/auth`.
- En prod, on garde des chemins relatifs pour laisser l'infra (Traefik / reverse proxy) router.

## Points d'attention pour infra
- Conserver le routage des chemins `/auth`, `/users`, `/me` côté edge proxy.
- Ne pas réécrire `/auth/*` d'une manière qui casserait `Path=/auth`.
- Autoriser les cookies et credentials entre frontend et auth-service.
