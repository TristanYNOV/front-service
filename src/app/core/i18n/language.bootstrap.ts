import { APP_INITIALIZER, Provider } from '@angular/core';
import { LanguageService } from './language.service';

export function provideLanguageBootstrap(): Provider {
  return {
    provide: APP_INITIALIZER,
    multi: true,
    deps: [LanguageService],
    useFactory: (languageService: LanguageService) => () => {
      languageService.initLang();
    },
  };
}
