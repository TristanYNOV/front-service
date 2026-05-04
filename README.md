# Front Service (Angular)

Frontend Angular principal de l’application (avec SSR/hydration), consommant plusieurs services backend via routes API.

## Prérequis
- Node.js 20+
- npm

## Installation
```bash
npm ci
```

## Développement local
```bash
npm start
```
- Frontend: `http://localhost:4200`
- Le mode dev utilise `proxy.conf.mjs` pour proxifier :
  - `/auth`, `/users`, `/me` vers `http://localhost:3000` (auth-service)
  - `/analysis/api/...` vers `http://localhost:3001/api/...` (analysis-store-service, via strip du préfixe `/analysis`)
- En production, le proxy Angular n'est pas utilisé : Traefik doit router publiquement `/analysis/...` vers analysis-store-service.

## Build local
```bash
npm run build
```
Le build produit un artefact SSR Angular (`dist/front-service/browser` + `dist/front-service/server`).

## Observability

Le serveur Node/SSR expose `GET /metrics` pour Prometheus:
- métriques runtime Node.js via `prom-client`,
- métriques HTTP agrégées par méthode, route normalisée et code statut,
- métriques SSR de durée de rendu et d'erreurs.

Les métriques restent côté serveur et n'incluent pas de données utilisateur, payload applicatif ou identifiant métier.

## Docker local
```bash
docker build -t front-service:local .
docker run --rm -p 4000:4000 -e AUTH_API_PREFIX=http://localhost:3000 front-service:local
```

## CI/CD GitHub Actions
- `lint.yml` : lint sur `push` (toutes branches) + `pull_request`.
- `build.yml` : build sur `push` (toutes branches) + `pull_request`.
- `publish-image.yml` : publication image GHCR **uniquement** sur `push` vers `master`.

## Publication image
Image publiée sur GHCR sous la forme:
- `ghcr.io/<owner>/<repo>:master`
- `ghcr.io/<owner>/<repo>:sha-<shortsha>`

## Contrat de déploiement (pour le futur repo infra)
Voir `contract/deployment/`:
- `README.md`
- `runtime-env.example`
- `compose.service.yaml`
- `ghcr-tags.md`
- `reverse-proxy.md`
- `rendering-strategy.md`

## Tests / qualité
```bash
npm run lint
npm run build
npm test
```
