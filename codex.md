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
- Utils séquençage : whitelist des touches (`ArrowUp`, `ArrowDown`, `Digit0..Digit9`) + modificateurs (`Shift`, `Ctrl`, `Alt`, `Meta`) + helpers `buildChord`/`formatNormalizedHotkey` dans `src/app/utils/sequencer/sequencer-hotkey-options.util.ts`, plus état partagé pour dialogs dans `src/app/utils/sequencer/sequencer-dialog-state.util.ts`.
- Services :
  - `SequencerPanelService` (config panneau, `btnList`, `panelName`, `editMode`) dans `src/app/core/service/sequencer-panel.service.ts`.
  - `SequencerRuntimeService` (feedback UI : flash, compteurs, `recentTriggers`) dans `src/app/core/service/sequencer-runtime.service.ts`.
  - `HotkeysService` : validation stricte des chords séquenceur (whitelist), collisions détectées, `isHotkeyUsed` renvoie aussi `isValid`. En mode édition, les hotkeys séquenceur sont ignorées (les hotkeys vidéo restent actives).
- UI Sequencing Panel (analyse) : TopBar A/E/L/N/Name/M, liste verticale de boutons (event/label) avec hotkey formatée + compteur, feedback visuel “hotkey → action” (flash 200ms + recent triggers).
- Dialogs Step1 : création/édition Event/Label via `create-event-btn-dialog` / `create-label-btn-dialog` + `hotkey-picker` (sélection base key + modificateurs, unassign).
- Cette base est conçue pour être étendue en Step2 (liens/activation) puis Step3 (canvas infini/layout).

## 15) Quality Step (pré-Step2) : styling & hotkeys
- **Styling `/analyse`**
  - Tailwind est la source principale pour layout/spacing/typography/borders/radius/flex/grid/responsive/hover/focus/transitions.
  - Dans les templates `/analyse`, **ne pas utiliser de classes couleur Tailwind** (`bg-slate-*`, `text-white`, etc.) ni `bg-[var(--...)]` / `text-[var(--...)]`.
  - Les couleurs doivent passer par des classes sémantiques du thème (`bg-*`, `text-*`, `border-*`, états `is-*`) définies dans `src/theme/*.class.scss`.
  - Les `*.component.scss` doivent rester vides, sauf override ponctuel de librairie externe.
  - Les overrides globaux de librairies (Angular Material, etc.) vont dans `src/theme/override/`.
- **Ajouter une nouvelle catégorie thème**
  1. Créer `src/theme/variables/_<category>.variables.scss` avec les variables CSS dans `:root { ... }` (et variantes `.dark-theme` si nécessaire).
  2. Créer `src/theme/_<category>.class.scss` avec `@use './variables/<category>.variables';` en tête, puis les classes sémantiques.
  3. Importer la catégorie dans `src/styles.scss` via `@use './theme/<category>.class';`.
- **Hotkeys Sequencer**
  - Whitelist étendue à `ArrowUp`, `ArrowDown`, `Digit0..Digit9`, `A..Z`.
  - Normalisation des lettres basée sur `event.key` (AZERTY/QWERTY), transformées en majuscules (`a` -> `A`).
  - Modificateurs conservés (`Shift`, `Ctrl`, `Alt`, `Meta`) ; les conflits avec hotkeys vidéo réservées et hotkeys séquenceur existantes restent bloquants.

## 16) Sequencing Panel - Step2 (liens + runtime minimal)
- Chaque bouton (`event`/`label`) supporte désormais deux listes de liens persistées dans `SequencerBtn` : `deactivateIds` et `activateIds` (tableaux, initialisés à `[]`).
- Les liens se configurent **uniquement en édition** (dialogs Event/Label, section “Liens”), avec :
  - select des IDs existants,
  - suppression par croix,
  - affichage enrichi `ID · name`.
- Règle suppression : **pas de cascade**.
  - Si un bouton ciblé est supprimé, son ID reste dans les listes.
  - L’UI l’affiche en état atténué + badge `missing`.
  - Le runtime l’ignore sans erreur.
- Runtime Step2 (`SequencerRuntimeService`) :
  - état signal `activeIndefiniteIds` (IDs actifs en durée indéfinie),
  - sur trigger run mode : toggle du bouton indéfini déclenché (START/ENDED),
  - puis application des liens dans l’ordre strict : `deactivateIds` **puis** `activateIds`,
  - uniquement pour des cibles existantes et de type indéfini.
- Logs console lisibles (format constant) :
  - `EVENT INDEFINITE <name> START|ENDED` (avec labels actifs lors du `ENDED`),
  - `LABEL INDEFINITE <name> START|ENDED`,
  - `EVENT <name> TRIGGERED | LabelsActive=[...]`,
  - `LABEL <name> TRIGGERED | ApplyToEvents=[...]`.
- UI liste verticale : les boutons indéfinis actifs sont marqués via la classe thème `.is-active`, en conservant le flash `.is-pressed` de Step1.

## 17) Sequencing Panel - Step3 (canvas + layout)
- La liste verticale est remplacée par `SequencerCanvasComponent` (`src/app/components/analyse/sequencer/canvas/*`) :
  - viewport scrollable natif (`overflow-auto`),
  - content layer relative avec dimensions dynamiques (`max(contentMinWidthPx/contentMinHeightPx, max(x+w|y+h)+padding)`),
  - pan “grab” uniquement sur le fond avec seuil `panDragThresholdPx`.
- Les layouts de boutons sont désormais stockés sur chaque `SequencerBtn.layout` via l’interface `SequencerBtnLayout` (`x`, `y`, `w`, `h`, `z`).
- Les constantes de canvas/modification sont centralisées dans `src/app/utils/sequencer/sequencer-canvas-defaults.util.ts` (min content, min button size, spirale, seuil pan).
- `SequencerPanelService` assure la persistance du layout :
  - `ensureLayout` + `ensureAllLayouts` pour initialiser les boutons sans layout,
  - placement initial en spirale (anti-overlap au spawn uniquement),
  - `updateLayout` pour drag/resize,
  - `bringBtnToFront` pour gérer le z-index auto.
- Mode édition : drag + resize coin bas-droite, bring-to-front automatique, hotkeys séquenceur toujours ignorées via `HotkeysService`.
- Mode run : clic canvas/hotkeys déclenchent `SequencerRuntimeService.trigger`, états visuels `.is-active` et `.is-pressed` conservés.
- Export JSON futur : il suffira de sérialiser chaque bouton avec `layout.x/y/w/h/z`; l’import reconstruira directement le canvas en réinjectant ces valeurs dans `btnList`.
- Ajustements UX post-Step3 : boutons clampés dans les bornes du canvas (toujours accessibles), scrollbar masquée (`hide-scrollbar`) au profit du pan click&drag, fond visuel en grille (`bg-canvas-grid`), contenu des cartes centré avec actions edit/delete compactes en haut-droite.
- Raffinement visuel des cartes canvas : code couleur par type (`.seq-btn-event` vert forêt / `.seq-btn-label` brun), texte contraste élevé, suppression du badge de type et du compteur, affichage focalisé sur `id`, `name`, `hotkey`; actions d’édition déplacées en coins supérieurs (edit gauche, delete droite) avec icônes réduites.
- Cohérence topbar/canvas : les actions `E` et `L` reprennent les mêmes classes couleur que les cartes Event/Label ; l’état actif des Event sur canvas utilise désormais une variation d’opacité (`.seq-btn-event-active`) plutôt qu’un swap de couleur.

## 18) Timeline MVP (/analyse)
- Feature NgRx `timelineState` ajoutée (`src/app/store/Timeline/*`) avec actions Init/Definitions/Occurrences/Sélection/Labels/Shift/Align/Undo.
- Le playhead n'est **pas** dispatché au store : `TimebaseService` expose des Signals (`currentTimeMs`, `isPlaying`, `durationMs`) et bascule entre mode vidéo (délégation `VideoService`) et mode chrono interne.
- `TimelineFacadeService` consomme les événements runtime du séquenceur (once/indefinite start/end) pour créer/fermer les occurrences, puis gère Shift/Align/Undo, nudge/resize timing et play selection (fusion d'intervalles + lecture séquentielle).
- UI Timeline (`src/app/components/analyse/timeline/*`) : layout 2 colonnes (liste events fixe + zone temps), ruler sticky, viewport scrollable X/Y, sélection simple/multi, handles resize, selection tools en footer, auto-follow contextuel + recenter.
- Mode sans vidéo : empty state + CTA chrono ; work duration tamponnée (`bufferWorkDurationMs`) pour conserver un espace de travail en faux live.
- Schéma/version : utilitaires dédiés (`src/app/utils/timeline/timeline-version.utils.ts`) avec regex stricte `^\d+\.\d+\.\d+$` et helpers validate/format/compare.

## 19) Sequencer Stats Buttons (V1)
- Nouveau type de bouton natif `stat` dans `SequencerBtn` avec payload `stat` sérialisable :
  - mode `simple` avec `query: { eventIds[], labelIds[], metric:'count', labelMatch:'all' }`
  - mode `complex` évalué sur AST (`constant`, `query`, `group` + opérateurs `+ - * /`).
  - UX d’édition complexe orientée expression mathématique visuelle : termes nommables librement (nom métier) + tokens (`terme`, opérateur, parenthèses), sans champ “priorité”.
- Topbar sequencer (`/analyse`) : bouton **Stats** (`query_stats`) pour créer un bouton `stat`.
- Canvas :
  - un bouton `stat` est rendu comme un vrai bouton (layout drag/resize inchangé),
  - en mode run il affiche `name + valeur live`, informatif uniquement (aucune action timeline au clic/hotkey),
  - l’icône `gesture_select` ouvre la configuration de stats en mode édition,
  - la modale est scrollable verticalement (header/actions stables) pour gérer de longues expressions.
- Service dédié `SequencerStatsService` (signals/computed) :
  - centralise le calcul de stats à partir des occurrences d’analyse,
  - évalue les requêtes simples (`count`) et expressions complexes,
  - renvoie les valeurs live + une sortie structurée (`exportRows`) pour futur export Excel.
- Règles métier V1 :
  - matching simple = `eventDefId ∈ eventIds` AND tous les labels demandés sont présents,
  - `labelMatch` implémenté uniquement en `all`,
  - division par zéro / calcul invalide => `null` (affichage `—`).
- Affichage des valeurs :
  - arrondi d’affichage uniquement,
  - entier sans décimales,
  - décimal avec maximum 2 décimales.
- Validation UX modale stats :
  - couleur prévisualisée via swatch simple,
  - mode simple valide uniquement si au moins un event est sélectionné,
  - couleurs de labels configurables côté stats (`labelColorById`) pour simple et termes requête en complexe,
  - mode complexe valide avec expression complète (tokens), parenthèses équilibrées, termes valides,
  - division statique par zéro bloquée à la configuration (division dynamique laissée au runtime, affichée `—`).
- Import/export JSON sequencer :
  - `SequencerPanelService.exportAsJson()` / `importFromJson()` prennent en charge `event`, `label`, `stat`,
  - la définition de stats reste stockée dans chaque bouton `stat` (source de vérité unique).
- Limites connues V1 :
  - pas de `%`, pas de parser texte libre,
  - pas de référence inter-boutons stats,
  - pas de métriques de durée (count seulement),
  - `labelMatch: 'any'` non implémenté (prévu plus tard).
