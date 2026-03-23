# Front deployment contract

Ce dossier est la source de vérité à copier/consommer depuis le futur repo `infra`.

## Rôle de l'image
L'image `front` embarque le runtime **Angular SSR (Node/Express)**. Elle sert le HTML rendu côté serveur (SEO), les assets statiques Angular et une route de healthcheck.

## Image GHCR attendue
- `ghcr.io/<owner>/<repo-front>:master`
- Exemple pour ce repo : `ghcr.io/<org>/front-service:master`

Voir aussi `ghcr-tags.md`.

## Prérequis
- Docker 24+
- Une gateway/reverse proxy (Traefik côté infra)
- Les services backend accessibles via les routes configurées (`/auth`, `/users`, `/me`, ...), ou via préfixe custom.

## Démarrage local (image publiée)
```bash
docker run --rm -p 4000:4000 \
  -e AUTH_API_PREFIX=http://localhost:3000 \
  ghcr.io/<owner>/<repo-front>:master
```

## Port exposé
- Conteneur : `4000`
- Endpoint healthcheck : `GET /healthz`

## Variables runtime
Référence exhaustive : `runtime-env.example`.

Variables les plus importantes :
- `PORT` (optionnel, défaut `4000`)
- `AUTH_API_PREFIX` (optionnel, préfixe commun pour générer les endpoints auth)
- `AUTH_LOGIN_ENDPOINT`, `AUTH_REGISTER_ENDPOINT`, `AUTH_REFRESH_ENDPOINT`, `AUTH_LOGOUT_ENDPOINT`, `AUTH_ME_ENDPOINT` (optionnelles, priorité haute)
- `API_ALLOWED_PREFIXES` (optionnel, CSV)

## Stratégie de démarrage
Le conteneur exécute `/app/entrypoint.sh` qui :
1. génère `/app/browser/runtime-config.js` à partir des variables d'environnement ;
2. démarre le serveur SSR Node (`node /app/server/server.mjs`).

## Healthcheck
- Applicatif : `GET /healthz` retourne `200 {"status":"ok"}`.
- Docker : healthcheck intégré dans le `Dockerfile`.

## Exemple compose minimal
Voir `compose.service.yaml`.
