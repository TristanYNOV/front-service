import { TranslocoTestingModule } from '@jsverse/transloco';

const fr = {
  actions: {
    cancel: 'Annuler',
    close: 'Fermer',
    create: 'Créer',
    delete: 'Supprimer',
    login: 'Se connecter',
    logout: 'Se déconnecter',
    register: 'Inscription',
    save: 'Enregistrer',
    update: 'Mettre à jour',
  },
  auth: {
    createAccount: 'Créer un compte',
    terms: 'Conditions Générales',
    termsRequired: 'Vous devez accepter les Conditions Générales pour créer un compte.',
  },
  common: {
    appName: 'Action Board',
  },
  language: {
    label: 'Langue',
  },
  menu: {
    menu: 'Menu',
  },
  sequencer: {
    addTerm: 'Ajouter un terme',
    anonymize: 'Anonymiser ce bouton',
    availableTerms: 'Termes disponibles',
    buttonColor: 'Couleur du bouton',
    complexSearch: 'Recherche complexe',
    constant: 'Constante',
    filterLabels: 'Labels filtres',
    hotkey: 'Raccourci',
    hotkeyInvalid: 'Raccourci invalide ou déjà utilisé.',
    id: 'ID',
    mathExpression: 'Expression mathématique',
    name: 'Nom',
    newQuery: 'Nouvelle requête',
    preview: 'Aperçu :',
    query: 'Requête',
    simpleQuery: 'Requête simple',
    simpleSearch: 'Recherche simple',
    targetEvents: 'Événements ciblés *',
    termName: 'Nom du terme',
    type: 'Type',
    unnamed: 'Sans nom',
    value: 'Valeur',
    errors: {
      colorInvalid: 'Couleur invalide (format #RRGGBB).',
      divisionByZero: 'Division statique par zéro détectée.',
      emptyExpression: 'L’expression est vide.',
      idNameRequired: 'ID et nom sont requis.',
      incompleteExpression: 'L’expression est incomplète.',
      invalidExpression: 'L’expression est invalide.',
      invalidTerm: 'Le terme "{{ term }}" est invalide.',
      invalidTermDefinition: 'Chaque terme doit avoir un nom et une définition valide.',
      misplacedOpenParenthesis: 'Parenthèse ouvrante mal placée.',
      missingOperator: 'Opérateur manquant entre deux termes.',
      operatorWithoutOperand: 'Opérateur sans opérande.',
      selectEvent: 'Sélectionne au moins un event.',
      termNotFound: 'Un terme référencé est introuvable.',
      unbalancedParentheses: 'Parenthèses non équilibrées.',
    },
  },
  video: {
    choose: 'Choisir une vidéo',
    chooseAnother: 'Choisir une autre vidéo',
    estimatedFps: 'FPS estimé',
    loadFailed: 'La vidéo n’a pas pu être chargée.',
    noneLoaded: 'Aucune vidéo chargée',
    removeTitle: 'Retirer la vidéo',
    unsupported: 'Votre navigateur ne supporte pas la lecture vidéo.',
  },
};

export function getTranslocoTestingModule() {
  return TranslocoTestingModule.forRoot({
    langs: { fr },
    translocoConfig: {
      availableLangs: ['fr', 'en'],
      defaultLang: 'fr',
      fallbackLang: 'fr',
      reRenderOnLangChange: true,
    },
    preloadLangs: true,
  });
}
