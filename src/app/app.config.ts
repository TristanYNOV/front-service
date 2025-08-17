import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { dataStateReducer } from './store/Data/dataState.reducers';
import { userReducer } from './store/User/user.reducer';
import { UserEffects } from './store/User/user.effects';
import { DataEffects } from './store/Data/dataState.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideAnimations(),
    provideStore({
      dataState: dataStateReducer,
      userState: userReducer
    }),
    provideEffects(UserEffects, DataEffects),
    provideHttpClient()
  ]
};
