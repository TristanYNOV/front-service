import { APP_INITIALIZER, Provider } from '@angular/core';
import { ThemeService } from './theme.service';

export function provideThemeBootstrap(): Provider {
  return {
    provide: APP_INITIALIZER,
    multi: true,
    deps: [ThemeService],
    useFactory: (themeService: ThemeService) => () => {
      themeService.initTheme();
    },
  };
}
