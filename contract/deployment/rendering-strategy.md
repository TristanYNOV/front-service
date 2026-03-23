# Rendering strategy (source de vérité)

## État actuel
- Le repo est configuré en Angular SSR (`@angular/ssr`, `server.ts`, `main.server.ts`) avec hydratation client.
- Le build Angular produit `browser + server`.

## Classification des routes (déduite depuis `app.routes.ts`)

### Routes publiques SEO-prioritaires
- `/` (landing): SSR recommandé et indexable.
- `/discover`: SSR possible, indexabilité à confirmer selon contenu métier.

### Routes applicatives/authentifiées
- `/welcome`: route d'accueil applicative, indexabilité faible priorité.
- `/analyse`: route authentifiée/outillée, généralement **non indexable** recommandée.
- `/club`, `/teams`, `/players`, `/tournaments`, `/matchs`: protégées auth/placeholder, non SEO.

### Route technique
- `/**` (not found): SSR utile pour renvoyer une page 404 cohérente.

## Cibles futures (à compléter côté produit/SEO)
1. Lister les pages marketing publiques à indexer (SSR + meta tags dédiés).
2. Marquer explicitement les routes app privées en `noindex`.
3. Évaluer un prerender/SSG partiel pour pages marketing stables.

## Limites connues
- La stratégie SEO fine (meta/canonical/robots par route) n'est pas encore explicitement codée.
- Ce document pose la structure de décision pour le futur repo infra + backlog front.
