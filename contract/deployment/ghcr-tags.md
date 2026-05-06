# GHCR tag policy

Publication uniquement via `publish-image.yml`, déclenchée sur push d'un tag Git stable `vX.Y.Z`.
Le commit taggé doit appartenir à l'historique de `origin/prod`.

## Image publiée
- `ghcr.io/<owner_lower>/front-service` (image privée GHCR)
- Exemple : `ghcr.io/<org_lower>/front-service`

## Tags publiés
- `latest`: dernière version stable publiée.
- `prod`: dernière version stable validée pour production.
- `X.Y.Z`: version SemVer sans préfixe `v` (exemple: `1.4.2`).

## Contraintes
- **Jamais de publication sur Pull Request.**
- **Jamais de publication directe sur une branche.**
- **Aucun tag Docker `dev`, `main`, `master`, `sha-*`, `vX.Y.Z`, majeur seul ou mineur seul.**

## Repérer la bonne image rapidement
- Dans GHCR : filtrer sur le package `front-service`, puis prendre `latest`, `prod` ou le tag `X.Y.Z` ciblé.
- Dans le workflow GitHub Actions : lire le résumé de job (step summary) qui expose l'image, les tags publiés et le digest final.
- Côté infra : consommer idéalement le digest (`image@sha256:...`) pour un déploiement immuable.
