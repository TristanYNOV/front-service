import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideTransloco, translocoConfig } from '@jsverse/transloco';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { dataStateReducer } from './store/Data/dataState.reducers';
import { DataEffects } from './store/Data/dataState.effects';
import { timelineReducer } from './store/Timeline/timeline.reducer';
import { analysisStoreReducer } from './store/AnalysisStore/analysis-store.reducer';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { refreshInterceptor } from './core/interceptors/refresh.interceptor';
import { analysisStoreDevAuthInterceptor } from './core/interceptors/analysis-store-dev-auth.interceptor';
import { provideAuthBootstrap } from './core/auth/auth.bootstrap';
import { AnalysisStoreEffects } from './store/AnalysisStore/analysis-store.effects';
import { TranslocoHttpLoader } from './core/i18n/transloco-loader';
import { provideLanguageBootstrap } from './core/i18n/language.bootstrap';
import { environment } from '../environments/environment';
import { MatSnackBarModule } from '@angular/material/snack-bar';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideAnimations(),
    importProvidersFrom(MatSnackBarModule),
    provideStore({
      dataState: dataStateReducer,
      timelineState: timelineReducer,
      analysisStoreState: analysisStoreReducer,
    }),
    provideEffects(DataEffects, AnalysisStoreEffects),
    provideHttpClient(withInterceptors([jwtInterceptor, analysisStoreDevAuthInterceptor, refreshInterceptor])),
    provideTransloco({
      config: translocoConfig({
        availableLangs: ['fr', 'en'],
        defaultLang: 'fr',
        fallbackLang: 'fr',
        reRenderOnLangChange: true,
        prodMode: environment.production,
      }),
      loader: TranslocoHttpLoader,
    }),
    provideLanguageBootstrap(),
    provideAuthBootstrap(),
  ],
};
