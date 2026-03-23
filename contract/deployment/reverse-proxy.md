# Reverse proxy contract (Traefik)

## Type d'application
- Front Angular en **SSR Node/Express** (pas un simple serveur statique).

## Port cible
- Le proxy doit router vers le port conteneur `4000`.

## Points de routage
- Toutes les routes frontend (`/`, `/discover`, `/analyse`, etc.) doivent pointer vers le front.
- Les routes API backend peuvent être routées séparément par Traefik.
- Si le front consomme des endpoints relatifs (`/auth`, `/users`, `/me`), Traefik doit les router vers le backend approprié.

## Deep-link / refresh
- En SSR, un refresh sur une route profonde fonctionne si Traefik transfère la requête telle quelle au serveur front.

## Headers recommandés
- Conserver `Host` et `X-Forwarded-*` pour que le serveur SSR reconstruise correctement les URLs absolues.

## Vigilance SEO
- Ne pas forcer de redirections cassant les URLs canoniques.
- Éviter de bloquer le crawl sur les routes publiques SEO.
- Maintenir la cohérence protocole/domaine (https en production) pour éviter le contenu dupliqué.
