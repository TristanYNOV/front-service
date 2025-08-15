import {Component, inject} from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import {MiniComponent} from './components/data-item-container/Minified/mini.component';
import {selectIdleItems, selectSavedItems} from './store/Data/dataState.selectors';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, RouterOutlet, MiniComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly store = inject(Store)

  get idleItems() {
    return this.store.selectSignal(selectIdleItems);
  }

  get savedItems() {
    return this.store.selectSignal(selectSavedItems);
  }
}

