# GHCR tag policy

Publication uniquement via `publish-image.yml`, déclenché sur `push` vers `master`.

## Tags publiés
- `master`: tag stable de la branche `master`.
- `sha-<shortsha>`: tag immuable pour chaque commit publié.
- tags Git (`refs/tags/*`): publiés si le workflow est adapté ultérieurement à des triggers tags.
- SemVer (`x.y.z`, `x.y`) : générés quand des tags SemVer Git existent.

## Contraintes
- **Jamais de publication sur Pull Request.**
- **Jamais de publication sur une branche autre que `master`.**
