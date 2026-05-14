import { Component, inject } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { MiniComponent } from './components/data-item-container/Minified/mini.component';
import { selectIdleItems, selectSavedItems } from './store/Data/dataState.selectors';
import { filter } from 'rxjs';
import { LayoutEditModeService } from './core/services/layout-edit-mode.service';
import { MatIconModule } from '@angular/material/icon';
import { SeoService } from './core/seo/seo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, RouterOutlet, RouterLink, MiniComponent, MatIconModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly seoService = inject(SeoService);
  protected readonly layoutEditMode = inject(LayoutEditModeService);

  showSidebar = true;
  showFooter = true;

  constructor() {
    this.updateLayoutForUrl(this.router.url);
    this.seoService.initRouteTracking();
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(({ urlAfterRedirects }) => {
        this.updateLayoutForUrl(urlAfterRedirects);
      });
  }

  get idleItems() {
    return this.store.selectSignal(selectIdleItems);
  }

  get savedItems() {
    return this.store.selectSignal(selectSavedItems);
  }

  private updateLayoutForUrl(url: string): void {
    const path = url.split('?')[0].split('#')[0];
    const publicFooterRoutes = ['/', '/fonctionnalites', '/tarifs', '/faq', '/contact', '/cgu', '/confidentialite'];
    this.showSidebar = path === '/fonctionnalites';
    this.showFooter = publicFooterRoutes.includes(path);
  }
}
