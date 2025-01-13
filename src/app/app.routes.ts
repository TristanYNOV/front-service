import { Routes } from '@angular/router';
import {LandingComponent} from './landing/landing.component';

export const routes: Routes = [
  {path: '', component: LandingComponent},
  {path: 'test', component: LandingComponent}
  // {path: 'home', component: HomeComponent},
  // {path: '404', component: ErrorNotFoundComponent},
  // {path: 'login', component: LoginComponent},
  // {path: 'register', component: RegisterComponent},
];
