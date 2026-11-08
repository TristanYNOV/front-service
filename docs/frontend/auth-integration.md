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
   - exclusion explicite de `login/register/refresh/logout` et des URL hors allowlist
   - un seul refresh réseau à la fois dans un onglet (single-flight)
   - réutilisation du token courant lorsqu'un 401 tardif concerne l'ancien token
   - rejeu unique avec le nouveau bearer ; marqueur local `HttpContextToken`, sans header réseau supplémentaire
   - les erreurs métier du rejeu (403/5xx/réseau) ne déconnectent pas l'utilisateur.

6. **Session expirée pendant une analyse**
   - un refresh refusé avec 401 ou un second 401 au rejeu passe à `reauthentication-required`
   - vidéo, panneau et timeline restent en mémoire ; le bandeau propose une reconnexion
   - les appels métier authentifiés sont bloqués pendant cet état ; l'export JSON local reste disponible
   - une reconnexion au même compte conserve le travail et la route ; un autre compte réinitialise l'espace avant d'être exposé
   - logout volontaire et suppression de compte effacent explicitement le travail
   - une réponse tardive de refresh ne peut pas réauthentifier après logout ou changement de compte
   - si le JWT renouvelé appartient à un autre compte (cookie remplacé dans un autre onglet), aucun rejeu du brouillon n'est effectué et une reconnexion explicite est requise
   - la conservation est limitée à cet onglet : fermer ou recharger la page ne sauvegarde pas le brouillon.

## Sécurité frontend
- Access token: **jamais** `localStorage/sessionStorage`; uniquement mémoire runtime.
- Refresh token: **jamais** manipulé côté JS (cookie HttpOnly backend).
- Aucun log sensible (mot de passe, token).
- Aucune dépendance aux rôles JWT côté MVP frontend.

## Routes publiques / privées
Allowlist publique:
- `/`
- `/fonctionnalites`
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
- Garder les endpoints navigateur sur la même origine ; ne pas exposer une URL Docker interne via `AUTH_API_PREFIX`.
- Inclure `/analysis/api` dans `API_ALLOWED_PREFIXES`, y compris dans les overrides du conteneur.

## Validation de la session

- `npm test` : tests unitaires et intégration HttpClient/session, concurrence, erreurs et changement de compte.
- `npm run test:runtime` : exécution de l'entrypoint dans un répertoire temporaire (shell POSIX ou Git Bash sous Windows).
- `npm run test:auth-integration` : test optionnel avec le dépôt voisin `auth-service` et ses dépendances installées (`AUTH_SERVICE_PATH` permet un autre chemin). Charge le vrai service et le vrai contrôleur, avec modèle en mémoire et clé éphémère : expiration réelle d'un JWT après une seconde, rotation, refus de l'ancien refresh et refus d'une session refresh dont l'échéance est dépassée. Aucune lecture de `.env` ni connexion MongoDB.
- Front démarré : `npm run test:session:e2e` ; adapter `--config baseUrl=...` si le port diffère.
- Essai prolongé : `npm run test:session:e2e -- --env SESSION_SOAK_MS=910000`.

Les E2E navigateur utilisent des réponses API déterministes. Ils couvrent aussi l'export local après expiration, le rechargement et deux instances Angular indépendantes dans des contextes de même origine. L'essai prolongé fait tourner une vidéo locale et sauvegarde toutes les 30 secondes en temps réel, puis provoque un refus du token et vérifie le refresh. Il ne remplace pas une recette avec les cookies, le proxy et les services réellement déployés. Le single-flight est limité à un onglet ; la rotation concurrente entre onglets reste à valider côté backend.
