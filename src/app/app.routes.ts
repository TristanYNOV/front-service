// app.routes.ts
import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { DiscoverComponent } from './pages/discover/discover.component';
import { authGuard } from './core/guards/auth.guard';
import { NotFoundComponent } from './pages/not-found/not-found.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'discover', component: DiscoverComponent },
  { path: 'welcome', component: DiscoverComponent, canActivate: [authGuard] },
  { path: '**', component: NotFoundComponent },
];
