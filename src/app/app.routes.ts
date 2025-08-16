// app.routes.ts
import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { DiscoverComponent } from './pages/discover/discover.component';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { authGuard } from './core/guards/auth.guard';
import { NotFoundComponent } from './pages/not-found/not-found.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'discover', component: DiscoverComponent },
  { path: 'welcome', component: WelcomeComponent, canActivate: [authGuard] },
  { path: '**', component: NotFoundComponent },
];
