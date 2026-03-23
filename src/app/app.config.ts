import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { dataStateReducer } from './store/Data/dataState.reducers';
import { DataEffects } from './store/Data/dataState.effects';
import { timelineReducer } from './store/Timeline/timeline.reducer';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { refreshInterceptor } from './core/interceptors/refresh.interceptor';
import { provideAuthBootstrap } from './core/auth/auth.bootstrap';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideAnimations(),
    provideStore({
      dataState: dataStateReducer,
      timelineState: timelineReducer,
    }),
    provideEffects(DataEffects),
    provideHttpClient(withInterceptors([jwtInterceptor, refreshInterceptor])),
    provideAuthBootstrap(),
  ],
};
