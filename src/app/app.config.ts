import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import {provideStore} from '@ngrx/store';
import {displayedDataReducer} from './store/displayedData/displayedData.reducers';
import {savedDataReducer} from './store/savedData/savedData.reducers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideAnimations(),
    provideStore({
      displayedData: displayedDataReducer,
      savedData: savedDataReducer,
    }),
  ]
};
