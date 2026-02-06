# Codex

## 1) TL;DR
- Front Angular 19 standalone + SSR, NgRx (store sous `src/app/store`), RxJS 7.8, TailwindCSS + quelques overrides Material. 
- Navigation principale déclarée dans [`src/app/app.routes.ts`](src/app/app.routes.ts) (landing, discover, welcome, analyse + placeholders club/teams/etc.).
- Store : slices `dataState` et `userState` enregistrés dans [`app.config.ts`](src/app/app.config.ts) ; effets dans `src/app/store/Data` et `src/app/store/User`.
- Auth mockée via [`AuthApi`](src/app/core/api/auth.api.ts) + stockage localStorage dans [`TokenService`](src/app/core/services/token.service.ts) ; guard licence en placeholder HTTP `/api/license/validate`.
- UI analyse : drag+resize via [`appCdkDragResize`](src/app/directives/cdk-drag-resize.directive.ts) et [`AnalysisPaneDirective`](src/app/pages/analyse/analysis-pane.directive.ts) ; mode édition/lock géré par [`LayoutEditModeService`](src/app/core/services/layout-edit-mode.service.ts).
- Hotkeys globales sur `/analyse` via [`HotkeysService`](src/app/core/services/hotkeys.service.ts) (réservées vidéo + personnalisables séquenceur, normalisation des chords, désactivation automatique en saisie).
- Tailwind actif via `src/styles.scss` (classes utilitaires + variables SCSS dans `src/theme/**`), Material pour menus/dialogs.
- Commandes : `npm start`, `npm run build`, `npm test`, `npm run lint` ; SSR via `npm run serve:ssr:front-service` après build.
- Pas de config d’environnement dédiée (pas de `environment.ts`) → URLs API à confirmer ou passer via gateway externe.
- Icônes : pas de lib dédiée ; usage SVG custom/Material (menu/dialog). Ajouter Material Icons si besoin ou préciser.

## 2) Produit & workflows
- Plateforme d’analyse vidéo sportive + gestion de club. Flux visibles :
  - **Landing** (`/`) : intro + lien vers Discover.
  - **Discover** (`/discover`) : canvas draggable de blocs de données (prix, texte) venant du store `dataState`.
  - **Auth + Welcome** (`/welcome`) : modal d’auth (login/register) déclenchée depuis le header, puis CTA vers club/analyse.
  - **Analyse** (`/analyse`) : layout de panneaux vidéo / séquenceur / timeline déplaçables et redimensionnables.
  - **Club/Teams/Players/Tournaments/Matchs** : placeholders “service unavailable” protégés par authGuard.

## 3) Architecture front
- Standalone components ; point d’entrée [`app.component.ts`](src/app/app.component.ts) + header + sidebar (idle/saved) + router-outlet.
- Organisation :
  - `core/` (API mock, guards, services, validators).
  - `components/` (analyse, discover canvas, data items, loading, service unavailable).
  - `directives/` (drag/resize utilitaires).
  - `pages/` (landing, discover, welcome, analyse, 404).
  - `store/` (NgRx). 
- Routing : `app.routes.ts` (voir section TL;DR). authGuard vérifie `selectIsLoggedIn`; licenseGuard placeholder HTTP.
- SSR : `main.server.ts` + `server.ts` Express (non customisé dans ce codex).

## 4) Architecture système (micro-services)
- Front consomme APIs via gateway (non configurée ici). Auth/API licence simulées :
  - Auth : [`AuthApi`](src/app/core/api/auth.api.ts) renvoie tokens mockés, erreur si email contient "error".
  - Licence : [`license.guard.ts`](src/app/core/guards/license.guard.ts) appelle `/api/license/validate` (TODO) et autorise tout en cas d’erreur.
- Base URLs/environnements : aucun `environment.ts` ni config Angular dédiée → ⚠️ À confirmer avec l’équipe backend/gateway.

## 5) Dépendances
- Angular 19, Angular Material ^19.0.5, Angular CDK, SSR (`@angular/ssr`).
- NgRx 19 (`store`, `effects`, `entity`, `router-store`, `devtools`).
- RxJS ~7.8.
- TailwindCSS 3.4 + PostCSS/Autoprefixer ; SCSS theming custom.
- Tests : Jasmine/Karma (`npm test`), Cypress présent (non scripté ici), ESLint 9 (`npm run lint`).

## 6) State management (NgRx)
- Store déclaré dans [`app.config.ts`](src/app/app.config.ts) avec slices `dataState` ([`dataState.reducers.ts`](src/app/store/Data/dataState.reducers.ts)) et `userState` ([`user.reducer.ts`](src/app/store/User/user.reducer.ts)).
- **Actions** : séparées par feature (`dataState.actions.ts`, `user.actions.ts`). Nommage `[Feature] Event`.
- **Reducers** : immutabilité via `createReducer`/`on`. `dataState` gère 3 listes (idle/displayed/saved) avec garde anti-duplicats; `userState` suit email/tokens/loading/error.
- **Effects** :
  - [`DataEffects`](src/app/store/Data/dataState.effects.ts) écoute la navigation (`NavigationEnd`) pour charger/vider les données Discover.
  - [`UserEffects`](src/app/store/User/user.effects.ts) enchaîne AuthApi, stocke tokens via `TokenService`, route vers `/welcome`, gère logout et hydratation initiale.
- **Selectors** : `createFeatureSelector` + selectors dérivés (`selectDisplayedItems`, `selectIsLoggedIn`, etc.). Utilisation de `store.selectSignal` dans les composants pour intégration Signals.
- **Pattern d’usage** : composant → (facultatif) directive/service → dispatch action → effect API/mock → reducer → selectors (Signals) pour dérivés. Éviter logique métier dans composants ; privilégier selectors mémoïsés.

## 7) UI & styling
- Tailwind disponible via `@tailwind` dans [`src/styles.scss`](src/styles.scss) + classes utilitaires dans les templates.
- Thème SCSS : variables dans `src/theme/variables/*.scss`, classes globales (`bg-layer-*`, `light-text`, etc.) via [`_global.class.scss`](src/theme/_global.class.scss); boutons via [`_btn.class.scss`](src/theme/_btn.class.scss).
- Material : menus (`MatMenu`), boutons (`MatButton`), dialogs (`MatDialog`), form fields/inputs dans la modal auth. Overrides couleur menu/dialog dans [`material-override.scss`](src/theme/override/_material-override.scss).
- Cohabitation : Tailwind pour layout/spacing, SCSS pour thèmes + styles drag/resize. Garder cohérence (pas d’override Material sauvage hors override dédié).

## 8) Directives & interactions
- Drag/Resize :
  - [`appCdkDragResize`](src/app/directives/cdk-drag-resize.directive.ts) ajoute handles, z-index controls, aspect lock (`lockAspectRatio`), bounds (`cdkDragBoundary`), événements drag/resize (start/move/end).
  - [`AnalysisPaneDirective`](src/app/pages/analyse/analysis-pane.directive.ts) enveloppe `appCdkDragResize` pour émettre des rectangles (dragEnd/resizeEnd) relatifs au conteneur analyse.
  - Layout edit/lock : [`LayoutEditModeService`](src/app/core/services/layout-edit-mode.service.ts) (signal + localStorage) ; classes `layout-edit`/`layout-locked` modifient l’interactivité des handles via CSS (`styles.scss`).
- Hotkeys (analyse) :
  - Service global [`HotkeysService`](src/app/core/services/hotkeys.service.ts) écoute `document:keydown` via RxJS et s’active uniquement depuis [`AnalyseComponent`](src/app/pages/analyse/analyse.component.ts).
  - Désactivation automatique en saisie : ignore `input`, `textarea`, `select`, et `contenteditable`.
  - Hotkeys **réservées vidéo** (non personnalisables) :
    - `Space` → play/pause
    - `ArrowLeft`/`ArrowRight` → seek ±1000 ms
    - `,` / `.` → step frame -1/+1
    - `-` / `/` → playbackRate ±0.25
  - Hotkeys **séquenceur** (personnalisables) enregistrées via `registerSequencerHotkey`, stockées séparément, collisions détectées (résultat typé).
  - Normalisation : `HotkeyChord` (key/code + modifiers) → string canonique (`Shift+Digit2`, `Space`, etc.), distinction des modificateurs incluse.
  - Nettoyage complet via `disable()` lors du `ngOnDestroy` de la page analyse.
  - API principale :
    - `enable()` / `disable()` + `enabled` (signal readonly).
    - `initReservedVideoHotkeys()` à l’entrée `/analyse`.
    - `registerSequencerHotkey(chord, actionId, handler, options?)` → `RegisterHotkeyResult` (`RESERVED_HOTKEY`, `ALREADY_USED`, `INVALID_CHORD`).
    - `unassignSequencerHotkey(chord)` / `unassignSequencerHotkeyByAction(actionId)` / `clearSequencerHotkeys()`.
    - `getUsedHotkeys()` / `getSequencerHotkeys()` / `isHotkeyUsed(chord)`.

## 9) Conventions Angular 19
- Standalone components/directives partout, imports locaux.
- `inject()` au lieu de constructeurs; `@if/@for/@switch` dans les templates.
- Signals : `store.selectSignal` + `LayoutEditModeService` expose `isEditMode` signal readonly.
- Forms : Reactive Forms typées basiques dans la modal auth (validators custom).
- RxJS : `take(1)` dans `auth.guard`, `switchMap`/`map`/`catchError` dans effects, `filter` sur routing. Pas de `takeUntilDestroyed` actuellement (⚠️ surveiller désabonnements manuels quand on ajoute des streams persistants).

## 10) Commandes & qualité
- Dev : `npm start` (serveur dev Angular). SSR : `npm run build` puis `npm run serve:ssr:front-service`.
- Build : `npm run build`. Tests unitaires : `npm test`. Lint : `npm run lint`. (E2E Cypress présent mais non scripté via npm → ⚠️ À confirmer avant usage.)
- Pré-commit perso : exécuter lint/tests si impact.

## 11) Gotchas / Debug
1. `auth.guard` dépend de `selectIsLoggedIn` → penser à dispatch `loadInitialState` (déjà dans `AppComponent`) si ajout de nouvelles entrées de store.
2. `license.guard` autorise tout en cas d’erreur et appelle `/api/license/validate` sans base URL configurée → risque 404 en dev ; stubber ou désactiver pour tests.
3. `LayoutEditModeService` persiste localStorage : attention SSR (protégé par `isPlatformBrowser`) mais éviter d’appeler `localStorage` ailleurs sans garde.
4. `appCdkDragResize` gère z-index interne et repositionne selon `cdkDragFreeDragPosition`; envoyer des coords absolues provoque des sauts → utiliser coords relatives au conteneur (cf. `AnalyseComponent.toRelativeRect`).
5. `DataEffects` vide les données Discover sur chaque navigation (`clearIdleData`) → si une page attend ces données, les recharger explicitement ou ajuster l’effet.
6. Icônes : placeholders texte/SVG ; si besoin d’icônes Material, ajouter la fonte Material Icons (non présente explicitement) ou importer modules Material adaptés.
7. Pas de gestion d’erreur UI dans les services API mock → wrappez vos appels avec notifications/UX si vous connectez un vrai backend.

## 12) Comment utiliser Codex sur ce repo
- Avant de coder :
  - Vérifier patterns existants (NgRx actions/reducers/effects/selectors, directives drag/resize, thèmes SCSS).
  - Identifier la feature/page concernée dans `pages/` ou `components/` ; réutiliser les services `core/` si possible.
  - Respecter la séparation : composants fins → dispatch/select ; logique asynchrone dans effects/services.
  - Choisir Tailwind pour layout rapide, SCSS thème pour couleurs/variables; suivre overrides Material existantes.
  - Sur l’analyse, passer par `LayoutEditModeService` pour gérer l’interactivité du layout.
- Pendant le dev :
  - Ajouter actions/selectors si nouvel état ; mémoïser selectors.
  - Utiliser `store.selectSignal`/Signals pour réactivité légère ; gérer les subscriptions manuelles (`Subscription` → `OnDestroy`).
  - Valider les formulaires via validators existants ou en créer dans `core/utils/validators`.
  - Pour les hotkeys : enregistrer les actions via [`HotkeysService`](src/app/core/services/hotkeys.service.ts), garder la logique métier dans des services/facades (ex: [`SequencerService`](src/app/core/services/sequencer.service.ts)).
- Avant PR : lancer lint/tests si concernés, vérifier navigation/guards, clean logs, mettre à jour `codex.md`/docs si besoin.

## 13) Règles PR
- Branches/PR suggérées : `feature/*`, `fix/*`, `chore/*`.
- Exigences : lint OK, tests OK (ou justifier), pas de logs debug, pas de code mort, respecter store NgRx (actions/reducers/effects/selectors cohérents), subscriptions nettoyées, styles alignés Tailwind/Material, accessibilité de base.
- Template PR (proposé si pas déjà présent) :

```
Objectif
 - Décrire le problème / la user story / le besoin métier
 - Lien issue/ticket : …

Changements réalisés
…

Impact / Risques
…

Comment tester
Étapes manuelles :
…
…
Commandes :
npm test / npm run test : ✅/❌
npm run lint : ✅/❌
npm run build : ✅/❌
E2E (si applicable) : ✅/❌

État des tests
Unit : ✅/❌/N/A
E2E : ✅/❌/N/A
Lint : ✅/❌

Confiance dans le dev
 - Très confiant
 - Plutôt confiant
 - Mitigé (détails ci-dessous)
 - Faible (besoin review approfondie)

Screenshots / Vidéo
(UI) Avant / Après

Checklist
 - Pas de breaking change non documenté
 - Store NgRx respecté (actions/reducers/effects/selectors cohérents)
 - Pas d’abonnement RxJS non détruit (ou usage takeUntilDestroyed)
 - Accessibilité de base (focus, aria si composant interactif)
 - Styles cohérents (Tailwind/Material, pas d’override sauvage)
 - Logs debug retirés
 - Docs mise à jour si nécessaire (codex.md / README)
```

## 14) Sequencing Panel - Step1
- Interfaces : `SequencerBtn` (event/label) + `SequencerPanel` dans `src/app/interfaces` ; hotkey chord partagé dans `src/app/interfaces/hotkey-chord.interface.ts`.
- Utils séquençage : whitelist des touches (`ArrowUp`, `ArrowDown`, `Digit0..Digit9`) + modificateurs (`Shift`, `Ctrl`, `Alt`, `Meta`) + helpers `buildChord`/`formatNormalizedHotkey` dans `src/app/utils/sequencer/sequencer-hotkey-options.util.ts`.
- Services :
  - `SequencerPanelService` (config panneau, `btnList`, `panelName`, `editMode`) dans `src/app/core/service/sequencer-panel.service.ts`.
  - `SequencerRuntimeService` (feedback UI : flash, compteurs, `recentTriggers`) dans `src/app/core/service/sequencer-runtime.service.ts`.
  - `HotkeysService` : validation stricte des chords séquenceur (whitelist), collisions détectées, `isHotkeyUsed` renvoie aussi `isValid`. En mode édition, les hotkeys séquenceur sont ignorées (les hotkeys vidéo restent actives).
- UI Sequencing Panel (analyse) : TopBar A/E/L/N/Name/M, liste verticale de boutons (event/label) avec hotkey formatée + compteur, feedback visuel “hotkey → action” (flash 200ms + recent triggers).
- Dialogs Step1 : création/édition Event/Label via `create-event-btn-dialog` / `create-label-btn-dialog` + `hotkey-picker` (sélection base key + modificateurs, unassign).
- Cette base est conçue pour être étendue en Step2 (liens/activation) puis Step3 (canvas infini/layout).
