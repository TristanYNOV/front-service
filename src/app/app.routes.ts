// app.routes.ts
import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { authGuard } from './core/guards/auth.guard';
import { licenseGuard } from './core/guards/license.guard';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { ServiceUnavailableComponent } from './components/service-unavailable/service-unavailable.component';
import { AnalyseComponent } from './pages/analyse/analyse.component';
import { FeaturesComponent } from './pages/features/features.component';
import { PricingComponent } from './pages/pricing/pricing.component';
import { FaqComponent } from './pages/faq/faq.component';
import { ContactComponent } from './pages/contact/contact.component';
import { TermsComponent } from './pages/terms/terms.component';
import { PrivacyComponent } from './pages/privacy/privacy.component';

export const routes: Routes = [
  { path: '', component: LandingComponent, data: { seoKey: 'home' } },
  { path: 'fonctionnalites', component: FeaturesComponent, data: { seoKey: 'features' } },
  { path: 'tarifs', component: PricingComponent, data: { seoKey: 'pricing' } },
  { path: 'faq', component: FaqComponent, data: { seoKey: 'faq' } },
  { path: 'contact', component: ContactComponent, data: { seoKey: 'contact' } },
  { path: 'cgu', component: TermsComponent, data: { seoKey: 'terms' } },
  { path: 'confidentialite', component: PrivacyComponent, data: { seoKey: 'privacy' } },
  { path: 'welcome', component: WelcomeComponent, canActivate: [authGuard], data: { seoKey: 'private' } },
  { path: 'club', component: ServiceUnavailableComponent, canActivate: [authGuard], data: { seoKey: 'private' } },
  { path: 'teams', component: ServiceUnavailableComponent, canActivate: [authGuard], data: { seoKey: 'private' } },
  { path: 'players', component: ServiceUnavailableComponent, canActivate: [authGuard], data: { seoKey: 'private' } },
  { path: 'tournaments', component: ServiceUnavailableComponent, canActivate: [authGuard], data: { seoKey: 'private' } },
  { path: 'matchs', component: ServiceUnavailableComponent, canActivate: [authGuard], data: { seoKey: 'private' } },
  { path: 'analyse', component: AnalyseComponent, canActivate: [authGuard, licenseGuard], data: { seoKey: 'private' } },
  { path: '**', component: NotFoundComponent, data: { seoKey: 'notFound' } },
];
