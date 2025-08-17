import { inject, Injectable } from '@angular/core';
import { createEffect } from '@ngrx/effects';
import { Router, NavigationEnd } from '@angular/router';
import { filter, switchMap } from 'rxjs';
import { loadDiscoverData, clearIdleData } from './dataState.actions';
import {Action} from '@ngrx/store';

@Injectable()
export class DataEffects {
  private router = inject(Router);

  routeChange$ = createEffect(() =>
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      switchMap(({ urlAfterRedirects }) => {
        const actions: Action[] = [clearIdleData()];
        switch (urlAfterRedirects) {
          case '/discover':
            actions.push(loadDiscoverData());
            break;
        }
        return actions;
      })
    )
  );
}
