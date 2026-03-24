# GHCR tag policy

Publication uniquement via `publish-image.yml`, déclenché sur `push` vers `prod`.

## Image publiée
- `ghcr.io/<owner_lower>/front-service` (image privée GHCR)
- Exemple : `ghcr.io/<org_lower>/front-service`

## Tags publiés
- `prod`: tag stable de la branche `prod`.
- `sha-<full_sha>`: tag immuable pour chaque commit publié (SHA Git complet).

## Contraintes
- **Jamais de publication sur Pull Request.**
- **Jamais de publication sur une branche autre que `prod`.**
- **Aucun tag `latest`, `master` ou `main`.**

## Repérer la bonne image rapidement
- Dans GHCR : filtrer sur le package `front-service`, puis prendre `prod` ou le tag `sha-<full_sha>` du commit ciblé.
- Dans le workflow GitHub Actions : lire le résumé de job (step summary) qui expose l'image, les deux tags et le digest final.
- Côté infra : consommer idéalement le digest (`image@sha256:...`) pour un déploiement immuable.
