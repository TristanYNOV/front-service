// app.routes.ts
import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { DiscoverComponent } from './pages/discover/discover.component';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { authGuard } from './core/guards/auth.guard';
import { licenseGuard } from './core/guards/license.guard';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { ServiceUnavailableComponent } from './components/service-unavailable/service-unavailable.component';
import { AnalyseComponent } from './pages/analyse/analyse.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'discover', component: DiscoverComponent },
  { path: 'welcome', component: WelcomeComponent, canActivate: [authGuard] },
  { path: 'club', component: ServiceUnavailableComponent, canActivate: [authGuard] },
  { path: 'teams', component: ServiceUnavailableComponent, canActivate: [authGuard] },
  { path: 'players', component: ServiceUnavailableComponent, canActivate: [authGuard] },
  { path: 'tournaments', component: ServiceUnavailableComponent, canActivate: [authGuard] },
  { path: 'matchs', component: ServiceUnavailableComponent, canActivate: [authGuard] },
  { path: 'analyse', component: AnalyseComponent, canActivate: [authGuard, licenseGuard] },
  { path: '**', component: NotFoundComponent },
];
