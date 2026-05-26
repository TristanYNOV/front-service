import { TranslocoTestingModule } from '@jsverse/transloco';

const fr = {
  actions: {
    cancel: 'Annuler',
    close: 'Fermer',
    login: 'Se connecter',
    logout: 'Se déconnecter',
    register: 'Inscription',
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
