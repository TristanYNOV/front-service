import {Component, inject} from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import {MiniComponent} from './components/data-item-container/Minified/mini.component';
import {selectIdleItems, selectSavedItems} from './store/Data/dataState.selectors';
import { loadInitialState } from './store/User/user.actions';
import {filter} from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, RouterOutlet, MiniComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  showSidebar = true;

  constructor() {
    this.store.dispatch(loadInitialState());

    this.showSidebar = !this.router.url.startsWith('/analyse');
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(({urlAfterRedirects}) => {
        this.showSidebar = !urlAfterRedirects.startsWith('/analyse');
      });
  }

  get idleItems() {
    return this.store.selectSignal(selectIdleItems);
  }

  get savedItems() {
    return this.store.selectSignal(selectSavedItems);
  }
}

