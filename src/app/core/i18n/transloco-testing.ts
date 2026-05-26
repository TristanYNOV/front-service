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
    hotkey: 'Raccourci',
    hotkeyInvalid: 'Raccourci invalide ou déjà utilisé.',
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
