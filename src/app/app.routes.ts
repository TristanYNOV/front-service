// app.routes.ts
import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { DiscoverComponent } from './pages/discover/discover.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'test', component: LandingComponent },
  { path: 'discover', component: DiscoverComponent },
];
