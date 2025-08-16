# Front Service

Front Service est l'interface web de l'application. Il s'agit d'une application Angular (v19) utilisant NgRx pour la gestion d'état, TailwindCSS pour le style et un serveur Express pour le rendu côté serveur (SSR).

## Structure du projet
```
front-service/
├── Dockerfile             # Image de production basée sur Nginx
├── angular.json           # Configuration Angular CLI
├── nginx.conf             # Configuration Nginx pour la distribution
├── package.json           # Dépendances et scripts NPM
├── public/                # Fichiers statiques (favicon, ...)
├── src/
│   ├── app/
│   │   ├── components/    # Composants réutilisables
│   │   ├── core/          # Services, API, guards et utilitaires
│   │   ├── directives/    # Directives personnalisées
│   │   ├── header/        # Composant d'en-tête
│   │   ├── pages/         # Pages de l'application (landing, discover, ...)
│   │   └── store/         # Gestion d'état avec NgRx
│   ├── theme/             # Styles globaux et variables
│   ├── index.html         # Document HTML principal
│   ├── main.ts            # Point d'entrée client
│   ├── main.server.ts     # Point d'entrée SSR
│   └── server.ts          # Serveur Express pour le SSR
└── tailwind.config.js     # Configuration TailwindCSS
```

## Prérequis
- [Node.js](https://nodejs.org/) 18+
- [Angular CLI](https://angular.dev/tools/cli) installé globalement (`npm install -g @angular/cli`)

## Installation
1. Cloner ce dépôt.
2. Installer les dépendances :
   ```bash
   npm install
   ```

## Utilisation
### Développement
Lancer un serveur de développement avec rechargement automatique :
```bash
npm start
```
Ouvrir le navigateur à [http://localhost:4200](http://localhost:4200).

### Tests et lint
```bash
npm test      # lance les tests unitaires
npm run lint  # exécute ESLint
```

### Build de production
```bash
npm run build
```
Le code compilé est généré dans le dossier `dist/`.

### Rendu côté serveur
Pour démarrer le serveur SSR après compilation :
```bash
npm run build
npm run serve:ssr:front-service
```

### Docker
Une image de production peut être construite via :
```bash
docker build -t front-service .
```

## Objet du projet
Ce service fournit l'interface utilisateur principale et consomme les API du backend. Il est conçu pour être déployé comme conteneur autonome et peut être servi derrière un reverse proxy Nginx.
