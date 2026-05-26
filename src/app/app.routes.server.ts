import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Pages publiques SEO : SSR runtime
  {
    path: '',
    renderMode: RenderMode.Server,
  },
  {
    path: 'fonctionnalites',
    renderMode: RenderMode.Server,
  },
  {
    path: 'tarifs',
    renderMode: RenderMode.Server,
  },
  {
    path: 'faq',
    renderMode: RenderMode.Server,
  },
  {
    path: 'contact',
    renderMode: RenderMode.Server,
  },
  {
    path: 'cgu',
    renderMode: RenderMode.Server,
  },
  {
    path: 'confidentialite',
    renderMode: RenderMode.Server,
  },

  // Routes privées / applicatives : pas de SSR ni prerender
  {
    path: 'welcome',
    renderMode: RenderMode.Client,
  },
  {
    path: 'club',
    renderMode: RenderMode.Client,
  },
  {
    path: 'teams',
    renderMode: RenderMode.Client,
  },
  {
    path: 'players',
    renderMode: RenderMode.Client,
  },
  {
    path: 'tournaments',
    renderMode: RenderMode.Client,
  },
  {
    path: 'matchs',
    renderMode: RenderMode.Client,
  },
  {
    path: 'analyse',
    renderMode: RenderMode.Client,
  },

  // Fallback / 404
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
